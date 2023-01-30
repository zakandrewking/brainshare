import { get as _get } from "lodash";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import MailIcon from "@mui/icons-material/Mail";

import basename from "../basename";
import Code from "./Code";
import { useAuth, invoke } from "../supabase";
import useSWR from "swr";

const gatewayUrl = process.env.REACT_APP_GATEWAY_URL;
if (gatewayUrl === undefined)
  throw Error("Missing environment variable REACT_APP_GATEWAY_URL");

interface ApiKey {
  id: string;
  name: string;
  value: string;
}

export default function ApiDocs() {
  const { session } = useAuth();

  const user_id: string | null = _get(session, ["user", "id"], null);

  const getApiKey = async (): Promise<ApiKey | null> => {
    try {
      return await invoke("api-key", "GET");
    } catch (error) {
      // ignore the error if the key doesn't exist yet
      if (_get(error, ["context", "status"]) === 404) return null;
      else throw error;
    }
  };

  const { data, error, isValidating, mutate } = useSWR(
    user_id ? `/functions/api-key/${user_id}` : null,
    getApiKey,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const apiKey: string | null = _get(data, ["value"], null);

  const create = async () => {
    // TODO progress for this? snackbar if it doesn't work
    await mutate(invoke("api-key", "POST"));
  };
  const revoke = async () => {
    // TODO progress for this? snackbar if it doesn't work
    await mutate(invoke("api-key", "DELETE"), {
      revalidate: false,
      optimisticData: null,
      rollbackOnError: true,
    });
  };

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
          <ListItem>
            <Typography paragraph={true}>
              Create an API key for Brainshare REST{" "}
            </Typography>
          </ListItem>
        ) : (
          <ListItem>
            <Typography paragraph={true}>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/log-in?redirect=/api-docs"
                sx={{ marginRight: "8px" }}
              >
                Log In
              </Button>{" "}
              to create an API key for Brainshare REST
            </Typography>
          </ListItem>
        )}
        <Card
          variant="outlined"
          sx={{
            padding: "18px 25px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginLeft: "-20px",
            marginBottom: "20px",
            maxWidth: "600px",
          }}
        >
          {error ? (
            <Box>Something went wrong. Try again soon.</Box>
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                <Button
                  variant="outlined"
                  onClick={create}
                  sx={{ flexGrow: 1 }}
                  disabled={!!apiKey || !session || isValidating}
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={revoke}
                  sx={{ flexGrow: 1 }}
                  disabled={!apiKey || isValidating}
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
                    // userSelect: "all",
                    flexGrow: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: "bold",
                  }}
                >
                  {apiKey}
                </Box>
              </Box>
            </>
          )}
        </Card>
        <ListItem>
          <Typography paragraph={true}>Access the API at:</Typography>
          <Typography paragraph={true}>
            <Code>{gatewayUrl}</Code>
          </Typography>
        </ListItem>
        <ListItem>
          <Typography paragraph={true}>
            Provide your key using the{"  "}
            <Code>x-api-key</Code> header. For example, using <Code>curl</Code>,
            you might call:
          </Typography>
          <Typography paragraph={true}>
            <Code>
              curl -H "x-api-key:{apiKey || "YOUR_KEY"}" "{gatewayUrl}
              /chemical?name=eq.acarbose"
            </Code>
          </Typography>
          <Typography paragraph={true}>
            <Box component="span" fontWeight="bold">
              NOTE:
            </Box>{" "}
            API requests are rate-limited to about 1 request per second. If
            you're looking for higher throughput,{" "}
            <Link href="mailto:zaking17@gmail.com">
              let me know.
              <MailIcon fontSize="small" sx={{ marginLeft: "4px" }} />
            </Link>
          </Typography>
        </ListItem>
        <ListItem>
          Find a full list of API endpoints in the{" "}
          <Link href={`${basename}/swagger`}>Swagger API Docs</Link>
        </ListItem>
      </List>
    </>
  );
}
