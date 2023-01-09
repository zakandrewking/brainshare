import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function Credits() {
  return (
    <Box>
      <Typography variant="h3">Credits</Typography>
      <Typography variant="subtitle1">
        Data sources for Brainshare Metabolism:
      </Typography>
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
          <Link
            href="https://www.ebi.ac.uk/chebi/aboutChebiForward.do"
            target="_blank"
          >
            ChEBI, CC BY 4.0 license
            <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
          </Link>
        </ListItem>
        <ListItem>
          {"Reaction data from "}
          <Link
            href="https://www.rhea-db.org/help/license-disclaimer"
            target="_blank"
          >
            Rhea, CC BY 4.0 license
            <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
          </Link>
        </ListItem>
        <ListItem>
          {"Protein data from "}
          <Link href="https://www.uniprot.org/help/license" target="_blank">
            UniProt, CC BY 4.0 license
            <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
          </Link>
        </ListItem>
      </List>
    </Box>
  );
}
