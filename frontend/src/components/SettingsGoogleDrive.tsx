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

import supabase, { useAuth } from "../supabase";
import useErrorBar from "../hooks/useErrorBar";
import { DefaultService } from "../client";
import useGoogleDrive from "../hooks/useGoogleDrive";

interface File {
  id: string;
  name: string;
}

export default function SettingsGoogleDrive() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const google = useGoogleDrive();

  const [files, setFiles] = useState<File[] | null>(null);
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
        await DefaultService.postRunUpdateSyncedFolder({
          id: newFolder.id,
        });
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

  // On access token change, check for drive access
  useEffect(() => {
    (async () => {
      if (google.gapi === null) return;
      // get files
      let response;
      try {
        // list folders in the root of My Drive
        response = await google.gapi.client.drive.files.list({
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
    })();
  }, [google.gapi]);

  return (
    <Container>
      <Typography variant="h4">Configure Google Drive</Typography>
      <List>
        <ListItem>
          <Button
            onClick={google.signIn}
            disabled={google.isLoading || google.accessToken !== null}
          >
            Connect Google Drive
          </Button>
          <Button
            onClick={async () => {
              setFiles(null);
              await google.signOut();
            }}
            disabled={google.isLoading || google.accessToken === null}
          >
            Disconnect Google Drive
          </Button>
        </ListItem>
        {!google.isLoading && google.accessToken !== null && (
          <ListItem>
            <Button to="/files" component={RouterLink}>
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
        <ListItem>
          {google.isLoading && (
            <Fade
              in={google.isLoading}
              style={{
                transitionDelay: google.isLoading ? "800ms" : "0ms",
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