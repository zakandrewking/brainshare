// TODO
// https://developers.google.com/identity/protocols/oauth2/web-server#node.js_1
//
// Access tokens expire. This library will automatically use a refresh token to
// obtain a new access token if it is about to expire. An easy way to make sure
// you always store the most recent tokens is to use the tokens event:

import _ from "lodash";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, CircularProgress, Fade, List, ListItem } from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { invoke, useAuth } from "../supabase";

export default function SettingsGoogleDrive() {
  const [status, setStatus] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) navigate("/log-in?redirect=/settings/google-drive");
  }, [session, navigate]);

  // On load, check for access token
  useEffect(() => {
    (async () => {
      try {
        const res = await invoke("google-token", "GET");
        if (res.accessToken) {
          setAccessToken(res.accessToken);
        }
        setIsChecking(false);
      } catch (error) {
        setStatus("Something went wrong");
        setIsChecking(false);
        console.log(error);
        throw Error(String(error));
      }
    })();
  }, []);

  const googleSignIn = async () => {
    setIsChecking(true);
    try {
      const res = await invoke("google-token?generateUri=true", "GET");
      if (res.authorizationUri) {
        window.location.href = res.authorizationUri;
      } else if (res.accessToken) {
        setAccessToken(res.accessToken);
        setIsChecking(false);
      }
    } catch (error) {
      setStatus("Something went wrong");
      setIsChecking(false);
      console.log(error);
      throw Error("Could not invoke google-token");
    }
  };

  const googleSignOut = async () => {
    setIsChecking(true);
    try {
      await invoke("google-token", "DELETE");
      setAccessToken(null);
      setIsChecking(false);
    } catch (error) {
      setStatus("Something went wrong");
      setIsChecking(false);
      console.log(error);
      throw Error("Could not invoke google-token (DELETE)");
    }
  };

  return (
    <Container>
      <Typography variant="h4">Configure Google Drive</Typography>
      <List>
        <ListItem>
          <Button
            onClick={googleSignIn}
            disabled={isChecking || accessToken !== null}
          >
            Connect Google Drive
          </Button>
          <Button onClick={googleSignOut} disabled={isChecking || !accessToken}>
            Disconnect Google Drive
          </Button>
        </ListItem>
        <ListItem>{status}</ListItem>
        <ListItem>
          {isChecking && (
            <Fade
              in={isChecking}
              style={{
                transitionDelay: isChecking ? "800ms" : "0ms",
              }}
              unmountOnExit
            >
              <CircularProgress />
            </Fade>
          )}
        </ListItem>
      </List>
    </Container>
  );
}
