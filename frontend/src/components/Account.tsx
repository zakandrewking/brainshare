import { useAuth } from "../supabaseClient";

import { Link as RouterLink, useNavigate } from "react-router-dom";

import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";

export default function Account() {
  const { session } = useAuth();
  const navigate = useNavigate();
  if (!session) {
    navigate("/log-in");
    return <></>;
  }

  return (
    <>
      <Typography variant="h4">Account</Typography>
      <List>
        <ListItem>
          <Button component={RouterLink} to="/api-docs">
            <KeyRoundedIcon sx={{ marginRight: 1 }} /> Manage Your API Key
          </Button>
        </ListItem>
        <ListItem>
          <Button component={RouterLink} to="/log-out">
            <LogoutRoundedIcon sx={{ marginRight: 1 }} /> Log Out
          </Button>
        </ListItem>
      </List>
    </>
  );
}
