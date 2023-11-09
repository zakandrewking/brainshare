// TODO
// https://developers.google.com/identity/protocols/oauth2/web-server#node.js_1
//
// Access tokens expire. This library will automatically use a refresh token to
// obtain a new access token if it is about to expire. An easy way to make sure
// you always store the most recent tokens is to use the tokens event:

import _ from "lodash";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useSWR from "swr";

import {
  Button,
  Checkbox,
  CircularProgress,
  Fade,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Select,
} from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import supabase, { invoke, useAuth } from "../supabase";
import { useScript } from "../util/useScript";
import useErrorBar from "./useErrorBar";
import { DefaultService } from "../client";

interface File {
  id: string;
  name: string;
}

export default function SettingsGoogleDrive() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const gapiStatus = useScript("https://apis.google.com/js/api.js");

  const [status, setStatus] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [files, setFiles] = useState<File[] | null>(null);
  const [gapi, setGapi] = useState<any>(null);
  const { showError } = useErrorBar();

  // check that we are logged in
  useEffect(() => {
    if (!session) navigate("/log-in?redirect=/settings/google-drive");
  }, [session, navigate]);

  const { data: syncedFolders, mutate } = useSWR(
    "/synced_folder?source=google_drive",
    async () => {
      const { data, error } = await supabase
        .from("synced_folder")
        .select("*")
        .filter("source", "eq", "google_drive");
      if (error) {
        console.error(error);
        throw Error("Could not fetch synced folders");
      }
      return data;
    }
  );

  const onUpdateSyncedFolders = async (checked: boolean, fileId: string) => {
    if (checked) {
      const { data: newFolder, error } = await supabase
        .from("synced_folder")
        .insert({
          user_id: session!.user.id,
          remote_id: fileId,
          source: "google_drive",
          name: _.find(files, { id: fileId })?.name || "<unknown>",
          project_id: null,
        })
        .select("*")
        .single();
      if (error) {
        console.error(error);
        showError();
        throw Error("Could not insert synced folder");
      }
      mutate([...syncedFolders!, newFolder], false);

      // start the sync job
      try {
        await DefaultService.postRunUdpateSyncedFolder(newFolder.id);
      } catch (error) {
        console.error(error);
        throw Error("Could not start sync job");
      }
    } else {
      const { error } = await supabase
        .from("synced_folder")
        .delete()
        .match({ user_id: session!.user.id, remote_id: fileId });
      if (error) {
        console.error(error);
        showError();
        throw Error("Could not delete synced folder");
      }
      mutate(_.reject(syncedFolders, { remote_id: fileId }), false);
    }
  };

  // On load, check for access token
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await invoke("google-token", "GET");
        if (res.accessToken) {
          setAccessToken(res.accessToken);
        } else if (res.noTokens) {
          setAccessToken(null);
        }
        setIsChecking(false);
      } catch (error) {
        setStatus("Something went wrong");
        setIsChecking(false);
        console.log(error);
        throw Error(String(error));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up gapi
  useEffect(() => {
    if (gapiStatus === "ready") {
      const gapiGlobal = (window as any).gapi;
      gapiGlobal.load("client", () => {
        setGapi(gapiGlobal);
      });
    }
  }, [gapiStatus]);

  // On access token change, check for drive access
  useEffect(() => {
    (async () => {
      if (gapi !== null && accessToken !== null) {
        await gapi.client.init({
          // TODO move this into the backend -- API key should not be public --
          // once supabase supports npm packages in edge functions
          // TODO cache the drive responses
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        });
        gapi.client.setToken({ access_token: accessToken });

        // get files
        let response;
        try {
          // list folders in the root of My Drive
          response = await gapi.client.drive.files.list({
            q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder'",
            orderBy: "name",
            fields: "files(id, name)",
            pageSize: 100,
          });
        } catch (error) {
          console.log(error);
          throw Error(String(error));
        }
        // ignore folders starting with "."
        const files = (response.result.files as File[]).filter(
          (x) => !x.name.startsWith(".")
        );
        setFiles(files);
      }
    })();
  }, [accessToken, gapi]);

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
    setAccessToken(null);
    setFiles(null);
    try {
      await invoke("google-token", "DELETE");
      setIsChecking(false);
    } catch (error) {
      setStatus("Something went wrong");
      setIsChecking(false);
      console.log(error);
      throw Error("Could not invoke google-token (DELETE)");
    }
  };

  const hasAccessToken = accessToken !== null;

  return (
    <Container>
      <Typography variant="h4">Configure Google Drive</Typography>
      <List>
        <ListItem>
          <Button
            onClick={googleSignIn}
            disabled={isChecking || hasAccessToken}
          >
            Connect Google Drive
          </Button>
          <Button
            onClick={googleSignOut}
            disabled={isChecking || !hasAccessToken}
          >
            Disconnect Google Drive
          </Button>
        </ListItem>
        {!isChecking && hasAccessToken && (
          <ListItem>
            <Button to="/file" component={RouterLink}>
              Go to Files
            </Button>{" "}
            to see your synced files
          </ListItem>
        )}
        <FormControl
          disabled
          size="small"
          sx={{
            display: "flex",
            flex: "0 5 auto",
            width: "200px",
          }}
        >
          <InputLabel>Project</InputLabel>
          <Select label="Project" value="default" autoWidth>
            <MenuItem value="default">Default</MenuItem>
          </Select>
        </FormControl>
        {files !== null && (
          <>
            <Typography variant="h6">Folders:</Typography>
            <FormGroup>
              {files.map((file, i) => (
                <FormControlLabel
                  key={i}
                  label={file.name}
                  control={<Checkbox />}
                  checked={syncedFolders?.some(
                    (syncedFolder) => syncedFolder.remote_id === file.id
                  )}
                  onChange={(_, checked) =>
                    onUpdateSyncedFolders(checked, file.id)
                  }
                />
              ))}
              {files.length === 100 && (
                <Typography variant="body2">
                  Only the first 100 folders are shown
                </Typography>
              )}
            </FormGroup>
          </>
        )}
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
