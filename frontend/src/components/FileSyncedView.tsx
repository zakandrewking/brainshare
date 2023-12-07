import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import useSWR from "swr";

import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Fade,
  Link,
} from "@mui/material";

import { useAsyncEffect } from "../hooks/useAsyncEffect";
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase from "../supabase";
import { Bold } from "./textComponents";

export default function FileViewSynced() {
  const { id } = useParams();
  const google = useGoogleDrive();
  const [content, setContent] = useState<string>("");

  const {
    data: file,
    error: fileError,
    isValidating,
  } = useSWR(`/file/${id}`, async () => {
    const { data, error } = await supabase
      .from("synced_file")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw Error(String(error));
    return data;
  });

  useAsyncEffect(
    async () => {
      if (!google.gapi || file === undefined) return;
      console.log(google.gapi.client);
      // download the file
      const res = await google.gapi.client.drive.files.get({
        fileId: file.remote_id,
        alt: "media",
      });
      setContent(res.body);
    },
    async () => {},
    [file, google.gapi]
  );

  return (
    <Container>
      <Box sx={{ marginBottom: "30px" }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/files">
            Files
          </Link>
          <Link component={RouterLink} to={`/file/${id}`}>
            {file?.name}
          </Link>
          <Bold>View</Bold>
        </Breadcrumbs>
      </Box>

      {file !== undefined && content !== "" && (
        <>
          {file.mime_type !== "text/plain" && (
            <>Cannot preview this file type yet</>
          )}
          {file.mime_type === "text/plain" && <FileViewText text={content} />}
        </>
      )}

      {/* Loading */}
      {isValidating && (
        <Box display="flex" justifyContent="center">
          <Fade
            in={isValidating}
            style={{
              transitionDelay: isValidating ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        </Box>
      )}
    </Container>
  );
}

function FileViewText({ text }: { text: string }) {
  return (
    <>
      Lines: {text.split("\n").length}
      <Box
        sx={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {text}
      </Box>
    </>
  );
}
