import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

export default function Docs() {
  return (
    <Box>
      <Typography variant="h3">Docs</Typography>
      <Typography variant="subtitle1">Using Brainshare Metabolism</Typography>
      <Typography variant="h6">Accessing the API</Typography>
      <Typography>
        {"Create an account at "}
        <Link href="https://brainshareb7662b9b.us.portal.konghq.com/login">
          https://brainshareb7662b9b.us.portal.konghq.com/login
        </Link>
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
            Select your email address, then My Apps, then New App
          </ListItem>
          <ListItem>Fill out the form</ListItem>
        </List>
      </Typography>
    </Box>
  );
}
