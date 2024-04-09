import { useState } from "react";
import {
  DropzoneInputProps,
  DropzoneRootProps,
  useDropzone,
} from "react-dropzone";

import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import { Box, Card, Stack, useMediaQuery } from "@mui/material";

import supabase, { useAuth } from "../supabase";
import { useParams } from "react-router-dom";

const FILE_BUCKET = "files";

export default function FileDrop() {
  const { session } = useAuth();
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { projectId } = useParams();

  const onDrop = async (acceptedFiles: File[]) => {
    setUploadStatus("Uploading...");
    acceptedFiles.forEach(async (file) => {
      const fileName = crypto.randomUUID();
      const { data: storageData, error: storageError } = await supabase.storage
        .from(FILE_BUCKET)
        .upload(fileName, file);
      if (storageError) {
        setUploadStatus("Error");
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
          project_id: projectId!,
        })
        .select("*")
        .single();
      if (fileError) {
        setUploadStatus("Error");
        throw Error(fileError.message);
      }
    });
    setUploadStatus("Upload complete");
  };
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
    });

  const dropzoneStatus =
    fileRejections.length !== 0
      ? "Could not read the file"
      : uploadStatus
      ? uploadStatus
      : isDragActive
      ? "Drop the files here ..."
      : "Drag a file here, or click to select a file";

  return (
    <Dropzone
      dropzoneStatus={dropzoneStatus}
      getInputProps={getInputProps}
      getRootProps={getRootProps}
      isDragActive={isDragActive}
      prefersDarkMode={prefersDarkMode}
    />
  );
}

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
