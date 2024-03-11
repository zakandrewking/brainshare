import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import useApiKey from "../hooks/useApiKey";
import { invoke, useAuth, GATEWAY_URL } from "../supabase";
import { LinkOut, MailOut } from "./links";
import Code from "./shared/Code";

export default function ApiDocs() {
  const { session } = useAuth();

  const { data, mutate, isLoading, error } = useApiKey(session?.user.id);

  const apiKey = data?.value;

  const handleCreate = async () => {
    // TODO progress for this? snackbar if it doesn't work
    await mutate(invoke("api-key", "POST"));
  };
  const handleRevoke = async () => {
    // TODO progress for this? snackbar if it doesn't work
    await mutate(invoke("api-key", "DELETE"), {
      revalidate: false,
      optimisticData: null,
      rollbackOnError: true,
    });
  };

  return (
    <Container maxWidth="md" sx={{ marginLeft: 0 }}>
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
                  onClick={handleCreate}
                  sx={{ flexGrow: 1 }}
                  disabled={!!apiKey || !session || isLoading}
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRevoke}
                  sx={{ flexGrow: 1 }}
                  disabled={!apiKey || isLoading}
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
            <Code>{GATEWAY_URL}</Code>
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
              curl -H "x-api-key:{apiKey || "YOUR_KEY"}" "{GATEWAY_URL}
              /chemical?name=eq.acarbose"
            </Code>
          </Typography>
          <Typography paragraph={true}>
            <Box component="span" fontWeight="bold">
              NOTE:
            </Box>{" "}
            API requests are rate-limited to about 1 request per second. If
            you're looking for higher throughput,{" "}
            <MailOut address="zaking17@gmail.com">let me know.</MailOut>
          </Typography>
        </ListItem>
        <ListItem>
          <Typography paragraph={true}>
            Example 1 - Perform a search:
          </Typography>
          <Typography paragraph={true}>
            <Code>
              curl -H "x-api-key:{apiKey || "YOUR_KEY"}" "{GATEWAY_URL}
              /rpc/search_graph" -H "Content-Type: application/json"{" "}
              {`-d '{"query": "glucose"}'`}
            </Code>
          </Typography>
        </ListItem>
        <ListItem>
          <Typography paragraph={true}>
            Example 2 - Get the reaction with <Code>id=4</Code> and all linked
            proteins:
          </Typography>
          <Typography paragraph={true}>
            <Code>
              curl --get -H "x-api-key:{apiKey || "YOUR_KEY"}" --data-urlencode
              "id=eq.4" --data-urlencode "select=*,protein(*)" "{GATEWAY_URL}
              /reaction"
            </Code>
          </Typography>
          <Typography paragraph={true}>
            There's a lot going on in that request! The REST API is served by{" "}
            <LinkOut href="https://postgrest.org/en/stable/index.html">
              PostgREST
            </LinkOut>
            , so check out{" "}
            <LinkOut href="https://postgrest.org/en/stable/api.html#resource-embedding">
              these excellent PostgREST docs
            </LinkOut>{" "}
            which show how to use joins, limits, and filters.
          </Typography>
          <Typography paragraph={true}>
            We're also using <Code>--get</Code> and{" "}
            <Code>--data-urlencode</Code> to make it easier to work with special
            characters in the URL.
          </Typography>
        </ListItem>
        <ListItem>
          A a full list of API endpoints are in the{" "}
          <Link href={"/swagger"}>Swagger API Docs</Link>.
        </ListItem>
      </List>
    </Container>
  );
}
