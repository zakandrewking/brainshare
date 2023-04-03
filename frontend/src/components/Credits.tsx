import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import { LinkOut } from "./links";

export default function Credits() {
  return (
    <Container>
      <Typography variant="h4">Credits</Typography>
      <Typography variant="subtitle1">Data sources for Brainshare:</Typography>
      <List
        sx={{
          listStyleType: "disc",
          pl: 2,
          "& .MuiListItem-root": {
            display: "list-item",
          },
        }}
      >
        <ListItem>
          {"Chemical data from "}
          <LinkOut href="https://www.ebi.ac.uk/chebi/aboutChebiForward.do">
            ChEBI, CC BY 4.0 license
          </LinkOut>
        </ListItem>
        <ListItem>
          {"Reaction data from "}
          <LinkOut href="https://www.rhea-db.org/help/license-disclaimer">
            Rhea, CC BY 4.0 license
          </LinkOut>
          {/* {" "}
          and from{" "}
          <Link
            href="https://www.metanetx.org/mnxdoc/mnxref.html"
            target="_blank"
          >
            MetaNetX, CC BY 4.0 license
            <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
          </Link> */}
        </ListItem>
        <ListItem>
          {"Protein data from "}
          <LinkOut href="https://www.uniprot.org/help/license">
            UniProt, CC BY 4.0 license
          </LinkOut>
        </ListItem>
        <ListItem>
          {"Species data from "}
          <LinkOut href="https://www.ncbi.nlm.nih.gov/home/about/policies/">
            NCBI Taxonomy
          </LinkOut>
        </ListItem>
      </List>
    </Container>
  );
}
