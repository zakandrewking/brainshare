import { useContext } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { DocStoreContext } from "../stores/DocStore";
import { Typography } from "@mui/material";
import { LinkOut } from "./links";

export default function Annotate() {
  const { state } = useContext(DocStoreContext);
  const doi = (state.crossref_work?.doi || "").replace("doi:", "");
  const title_stripped = (state.crossref_work?.title || "")
    .replace(/<\/?i>/g, " ")
    .replace(/\s+/g, " ");
  return (
    <Container>
      <Typography variant="h6">Paper</Typography>
      <Stack>
        <Box>
          DOI: <LinkOut href={`https://doi.org/${doi}`}>{doi}</LinkOut>
        </Box>
        <Box>Title: {title_stripped}</Box>
        <Box>
          Authors:{" "}
          {state.crossref_work?.authors
            .map((author) => `${author.family}, ${author.given}`)
            .join("; ")}
        </Box>
      </Stack>
      <Typography variant="h6">Categories</Typography>
      {state.categories.join(", ")}
      <Typography variant="h6">Tags</Typography>
      {state.tags.map((tag) => (
        <Chip label={tag} sx={{ margin: "3px" }} />
      ))}
    </Container>
  );
}
