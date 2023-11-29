import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";

import { DatabaseExtended } from "../databaseExtended.types";
import supabase from "../supabase";
import { formatBytes } from "../util/stringUtils";
import { Error404 } from "./errors";
import { Bold } from "./textComponents";

const FILE_BUCKET = "files";

type FileRow = DatabaseExtended["public"]["Tables"]["file"]["Row"];

export default function File() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobStatus, setJobStatus] = useState<string>("");

  const { data: file, error } = useSWR(`/file/${id}`, async () => {
    const { data: file, error } = await supabase
      .from("file")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error(error);
      throw Error("Could not fetch file");
    }
    return file;
  });

  // get job status
  useEffect(() => {
    if (!file?.latest_task_id) {
      setJobStatus("Job did not start");
      return;
    }
    (async () => {
      // try {
      //   const { status } = await DefaultService.getRunAnnotateFile(
      //     file?.latest_task_id ?? ""
      //   );
      //   if (status === RunStatus.STARTED) {
      //     setJobStatus("Annotating file");
      //   } else if (status === RunStatus.DONE) {
      //     setJobStatus("File annotation complete");
      //   } else if (status === RunStatus.FAILED) {
      //     setJobStatus("Failed");
      //   } else if (status === RunStatus.PENDING) {
      //     setJobStatus("Pending");
      //   } else {
      //     setJobStatus("Unknown");
      //   }
      // } catch (error) {
      //   setJobStatus("Could not retrieve job status");
      // }
    })();
  }, [file]);

  if (error) return <Error404 />;
  if (!file) return <div>Loading...</div>;

  const onDelete = (id: number, object_path: string) => () =>
    (async () => {
      const { error } = await supabase.from("file").delete().match({ id });
      if (error) throw Error(String(error));
      const { error: storageError } = await supabase.storage
        .from(FILE_BUCKET)
        .remove([object_path]);
      if (storageError)
        throw Error(`${storageError.name} - ${storageError.message}`);
      mutate(
        "/file",
        async ({ rows }: { rows: FileRow[] }) => {
          return { rows: rows ? rows.filter((row) => row.id !== id) : [] };
        },
        { revalidate: false }
      );
      navigate("/file");
    })();

  return (
    <List sx={{ marginTop: "10px", marginLeft: 0 }}>
      <ListItem>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/file">
            Files
          </Link>
          <Bold>{file.name}</Bold>
        </Breadcrumbs>
      </ListItem>
      <ListItem>
        <Card variant="outlined">
          <CardHeader
            avatar={<InsertDriveFileRoundedIcon />}
            title={
              <Stack>
                <Box>
                  <Bold>{file.name}</Bold>
                </Box>
                <Box>{formatBytes(file.size)}</Box>
                <Box>MIME Type: {file.mime_type}</Box>
                <Box>Tokens: {file.tokens}</Box>
              </Stack>
            }
          />
        </Card>
      </ListItem>
      <ListItem>Job Status: {jobStatus}</ListItem>
      <ListItem>
        <Button
          variant="outlined"
          onClick={onDelete(file.id, file.object_path)}
        >
          Delete
        </Button>
      </ListItem>
    </List>
  );
}
