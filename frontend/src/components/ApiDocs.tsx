import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import basename from "../basename";
import { useAuth, useApiKey } from "../supabaseClient";

export default function ApiDocs() {
  const { session } = useAuth();
  const { apiKey, createApiKey, revokeApiKey, creating, revoking } =
    useApiKey();

  return (
    <>
      <Typography variant="h4">API Docs</Typography>
      <Typography variant="subtitle1">Using the Brainshare REST API</Typography>
      <List
        sx={{
          listStyleType: "decimal",
          "& .MuiListItem-root": {
            display: "list-item",
          },
          marginLeft: "20px",
        }}
      >
        {session ? (
          <ListItem>Create an API key for Brainshare REST </ListItem>
        ) : (
          <ListItem>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/api-docs"
            >
              Log In
            </Button>{" "}
            to create an API key for Brainshare REST
          </ListItem>
        )}
        <Card
          variant="outlined"
          sx={{
            padding: "18px 25px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginLeft: "13px",
            maxWidth: "600px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
            <Button
              variant="outlined"
              onClick={createApiKey}
              sx={{ flexGrow: 1 }}
              disabled={Boolean(apiKey) || !session || creating}
            >
              Create
            </Button>
            <Button
              variant="outlined"
              onClick={revokeApiKey}
              sx={{ flexGrow: 1 }}
              disabled={!apiKey || revoking}
            >
              Revoke
            </Button>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: 0, whiteSpace: "nowrap" }}>Your API Key:</Box>
            <Box
              sx={{
                userSelect: "all",
                flexGrow: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: "bold",
              }}
            >
              {apiKey?.key}
            </Box>
          </Box>
        </Card>
        <ListItem>
          Access the API by providing your key as an "apikey: " header
        </ListItem>
        <ListItem>
          <Link href={`${basename}/swagger/`}>Swagger API Docs</Link>
        </ListItem>
        <ListItem>Examples:</ListItem>
      </List>
    </>
  );
}
