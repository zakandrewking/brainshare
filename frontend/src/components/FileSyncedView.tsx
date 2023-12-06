import { useParams } from "react-router-dom";
import useSWR from "swr";
import supabase from "../supabase";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Fade,
  Link,
  Stack,
  Toolbar,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Bold } from "./textComponents";

export default function FileViewSynced() {
  const { id } = useParams();

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

  // Load from google

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

      {file !== undefined && (
        <>
          {file.mime_type !== "text/plain" && (
            <>Cannot preview this file type yet</>
          )}
          {file.mime_type === "text/plain" && <FileViewText text={""} />}
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
          height: "100%",
          overflow: "scroll",
        }}
      >
        {text}
      </Box>
    </>
  );
}
