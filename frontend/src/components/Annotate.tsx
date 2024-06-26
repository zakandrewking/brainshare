import { useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import { Link, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { DocStoreContext } from "../stores/DocStore";
import { capitalizeFirstLetter } from "../util/stringUtils";
import { LinkOut } from "./links";
import { Bold, Italic, Paragraph } from "./textComponents";

export default function Annotate() {
  const { state } = useContext(DocStoreContext);
  const doi = (state.crossref_work?.doi || "").replace("doi:", "");
  const title_stripped = (state.crossref_work?.title || "")
    .replace(/<\/?i>/g, " ")
    .replace(/\s+/g, " ");
  return (
    <Container sx={{ marginTop: "10px", marginLeft: 0 }}>
      {state.crossref_work ? (
        <Card variant="outlined">
          <CardHeader
            avatar={<ArticleRoundedIcon />}
            title={
              <Stack>
                <Box>
                  <LinkOut href={`https://doi.org/${doi}`}>{doi}</LinkOut>
                </Box>
                <Box>
                  <Bold>{title_stripped}</Bold>
                </Box>
                <Box>
                  {state.crossref_work?.authors
                    .map((author) => `${author.family}, ${author.given}`)
                    .join("; ")}
                </Box>
              </Stack>
            }
          />
        </Card>
      ) : (
        <Typography>Could not find a valid DOI in this PDF</Typography>
      )}
      <Typography variant="h6">Tags</Typography>
      {state.tags.map((tag) => (
        <Chip label={tag} sx={{ margin: "3px" }} />
      ))}
      <Typography variant="h6">Brainshare Matches</Typography>
      <Stack spacing={2}>
        {state.categories
          .sort((a, b) =>
            a.url && !b.url // matches first
              ? -1
              : !a.url && b.url
              ? 1
              : a.type.localeCompare(b.type)
          )
          .map((x) => (
            <Box key={`${x.type}-${x.name}`}>
              {capitalizeFirstLetter(x.type)}:{" "}
              <Bold>
                {x.url ? (
                  <Link component={RouterLink} to={x.url}>
                    {x.name}
                  </Link>
                ) : (
                  x.name + " (not found in database)"
                )}
              </Bold>
              <Paragraph>
                <Italic>{x.summary}</Italic>
              </Paragraph>
            </Box>
          ))}
      </Stack>
    </Container>
  );
}
