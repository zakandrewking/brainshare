import _ from "lodash";
import { useContext } from "react";
import {
  DropzoneInputProps,
  DropzoneRootProps,
  useDropzone,
} from "react-dropzone";
import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import { ListItemIcon } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";

import { DefaultService } from "../client";
import { DatabaseExtended } from "../databaseExtended.types";
import supabase, { useAuth } from "../supabase";
import { formatBytes } from "../util/stringUtils";
import { FileStoreContext } from "./FileStore";
import GoogleDriveSync from "./GoogleDriveSync";

const FILE_BUCKET = "files";

type FileRow = DatabaseExtended["public"]["Tables"]["file"]["Row"];

function Dropzone({
  dropzoneStatus,
  getInputProps,
  getRootProps,
  isDragActive,
  prefersDarkMode,
}: {
  dropzoneStatus: string;
  getInputProps: <T extends DropzoneInputProps>(props?: T | undefined) => T;
  getRootProps: <T extends DropzoneRootProps>(props?: T | undefined) => T;
  isDragActive: boolean;
  prefersDarkMode: boolean;
}) {
  return (
    <Card
      variant="outlined"
      {...getRootProps()}
      sx={{
        cursor: "pointer",
        padding: "20px",
        marginTop: "30px",
        borderRadius: "3px",
        backgroundColor: prefersDarkMode
          ? isDragActive
            ? "hsl(290deg 15% 40%)"
            : "hsl(290deg 15% 30%)"
          : isDragActive
          ? "hsl(280deg 37% 87%)"
          : "hsl(280deg 56% 96%)",
        ":hover": {
          backgroundColor: prefersDarkMode
            ? "hsl(290deg 15% 40%)"
            : "hsl(280deg 37% 87%)",
        },
      }}
    >
      <input {...getInputProps()} />
      <Stack spacing={2} alignItems="center">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            alignContent: "center",
          }}
        >
          <FileUploadRoundedIcon sx={{ margin: "10px" }} />
          {dropzoneStatus}
        </Box>
      </Stack>
    </Card>
  );
}

function FileRows({
  rows,
  onDelete,
}: {
  rows: FileRow[];
  onDelete: (id: number, path: string) => () => void;
}) {
  return (
    <List>
      {rows.map((row, i) => (
        <ListItem
          key={i}
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            component={RouterLink}
            to={`/file/${row.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              marginRight: "20px",
            }}
          >
            <ListItemIcon>
              <InsertDriveFileRoundedIcon />
            </ListItemIcon>
            {row.name} ({formatBytes(row.size)})
          </Button>
          <Button
            variant="outlined"
            onClick={onDelete(row.id, row.object_path)}
          >
            Delete
          </Button>
        </ListItem>
      ))}
    </List>
  );
}

export default function FileList() {
  const { session } = useAuth();
  const { state, dispatch } = useContext(FileStoreContext);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // const getKey = (page: number, previousPageData: any) => {
  //   if (previousPageData && !previousPageData.rows.length) return null; // reached the end
  //   return {
  //     url: `/file`,
  //     page,
  //     limit: PAGE_SIZE,
  //     locationKey: location.key, // reload if we route there from a separate click
  //   };
  // };

  // const fetcher = async ({ page, limit }: { page: number; limit: number }) => {
  //   const start = page * limit;
  //   const end = (page + 1) * limit - 1;
  //   const {
  //     data: rows,
  //     error,
  //     count,
  //   } = await supabase
  //     .from("file")
  //     .select("*", page === 0 ? { count: "exact" } : {})
  //     .range(start, end);
  //   if (error) throw Error(String(error));
  //   return {
  //     rows,
  //     ...(page === 0 ? { count } : {}),
  //   };
  // };

  const { data, error, mutate } = useSWR(
    "/file",
    async () => {
      const { data: rows, error } = await supabase.from("file").select("*");
      if (error) {
        console.error(error);
        throw Error("Could not fetch files");
      }
      return { rows };
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const rows = data?.rows;

  const onDrop = async (acceptedFiles: File[]) => {
    dispatch({ uploadStatus: "Uploading..." });
    acceptedFiles.forEach(async (file) => {
      const fileName = crypto.randomUUID();
      const { data: storageData, error: storageError } = await supabase.storage
        .from(FILE_BUCKET)
        .upload(fileName, file);
      if (storageError) {
        dispatch({ uploadStatus: "Error" });
        throw Error(`${storageError.name} - ${storageError.message}`);
      }
      const { data: fileData, error: fileError } = await supabase
        .from("file")
        .insert({
          name: file.name,
          size: file.size,
          bucket_id: FILE_BUCKET,
          object_path: storageData.path,
          user_id: session!.user.id,
          project_id: null,
        })
        .select("*")
        .single();
      if (fileError) {
        dispatch({ uploadStatus: "Error" });
        throw Error(fileError.message);
      }
      // TODO do this optimistically and then recover
      mutate(
        { rows: rows ? [fileData, ...rows] : [fileData] },
        { revalidate: false }
      );
      // Annotate the file
      try {
        // await DefaultService.postRunAnnotate(fileData);
      } catch (annotateError) {
        // if we cannot annotate, then throw an error here for debugging. In the
        // status page, we'll assume that if last_task_id is empty, then the job
        // never started.
        throw Error(String(annotateError));
      }
    });
    dispatch({ uploadStatus: "Upload complete" });
    setTimeout(() => {
      dispatch({ uploadStatus: undefined });
    }, 1000);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
    });

  const dropzoneStatus =
    fileRejections.length !== 0
      ? "Could not read the file"
      : state.uploadStatus
      ? state.uploadStatus
      : isDragActive
      ? "Drop the files here ..."
      : "Drag a file here, or click to select a file";

  const onDelete = (id: number, object_path: string) => () =>
    (async () => {
      const { error } = await supabase.from("file").delete().match({ id });
      if (error) {
        console.error(error);
        throw Error("Could not delete file");
      }
      const { error: storageError } = await supabase.storage
        .from(FILE_BUCKET)
        .remove([object_path]);
      if (storageError)
        throw Error(`${storageError.name} - ${storageError.message}`);
      mutate(
        { rows: rows ? rows.filter((row) => row.id !== id) : [] },
        { revalidate: false }
      );
    })();

  if (error) return <div>failed to load</div>;
  if (!rows) {
    return <div>loading...</div>;
  }

  return (
    <Container>
      <Stack spacing={4}>
        {/* <Typography variant="h4">Files</Typography> */}
        {session ? (
          <>
            {/* <Dropzone
              dropzoneStatus={dropzoneStatus}
              getInputProps={getInputProps}
              getRootProps={getRootProps}
              isDragActive={isDragActive}
              prefersDarkMode={prefersDarkMode}
            />
            <FileRows rows={rows} onDelete={onDelete} /> */}
            <GoogleDriveSync />
          </>
        ) : (
          <Box sx={{ marginTop: "30px" }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/file"
            >
              Log in
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
