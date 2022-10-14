import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function Docs() {
  return (
    <Box>
      <Typography variant="h3">Docs</Typography>
      <Typography variant="subtitle1">Using Brainshare Metabolism</Typography>
      <Typography variant="h6">Accessing the REST API</Typography>
      <Typography>
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
            {"Create an account at "}
            <Link
              href="https://silent-paddock-dev.aws-euw1.cloud-ara.tyk.io/"
              target="_blank"
            >
              https://silent-paddock-dev.aws-euw1.cloud-ara.tyk.io/{" "}
              <OpenInNewIcon fontSize="small" />
            </Link>
          </ListItem>
          <ListItem>Create an API key for Brainshare REST</ListItem>
          <ListItem>
            Access the API by providing your key as an "apikey: " header
          </ListItem>
          <ListItem>Swagger:</ListItem>
          <ListItem>API Spec:</ListItem>
          <ListItem>Examples:</ListItem>
        </List>
      </Typography>
    </Box>
  );
}
