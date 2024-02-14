import _ from "lodash";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useSWR from "swr";

import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { useAsyncEffect } from "../hooks/useAsyncEffect";
import { Paragraph } from "./textComponents";

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

  // dialog
  const [checkDeleteId, setCheckDeleteId] = useState<string | null>(null);
  const [confirmedDeleteId, setConfirmedDeleteId] = useState<string | null>(
    null
  );

  // check that we are logged in
  useEffect(() => {
    if (!session) navigate("/log-in?redirect=/account/google-drive");
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
        // update the root of the synced folder
        await DefaultService.postTaskSyncFolder({
          synced_folder_id: newFolder.id,
        });
      } catch (error) {
        console.error(error);
        throw Error("Could not start sync job");
      }
    } else {
      // unchecked. use a dialog to confirm
      setCheckDeleteId(fileId);
    }
  };

  useAsyncEffect(
    async () => {
      if (confirmedDeleteId !== null) {
        setCheckDeleteId(null);
        setConfirmedDeleteId(null);
        const { error } = await supabase
          .from("synced_folder")
          .delete()
          .match({ user_id: session!.user.id, remote_id: confirmedDeleteId });
        if (error) {
          console.error(error);
          showError();
          throw Error("Could not delete synced folder");
        }
        mutate(
          _.reject(syncedFolders, { remote_id: confirmedDeleteId }),
          false
        );
      }
    },
    async () => {},
    [confirmedDeleteId]
  );

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
    <>
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
              mb: "20px",
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
              <Paragraph>Brainshare can only sync top-level folders.</Paragraph>
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

      {/* Dialogs */}
      <Dialog
        open={checkDeleteId !== null}
        onClose={() => {
          setCheckDeleteId(null);
          setConfirmedDeleteId(null);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Stop syncing folder?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to stop syncing this folder? Your annotations
            will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmedDeleteId(null);
              setCheckDeleteId(null);
            }}
          >
            No, keep keep syncing
          </Button>
          <Button
            onClick={() => {
              setConfirmedDeleteId(checkDeleteId);
              setCheckDeleteId(null);
            }}
          >
            Yes, stop syncing
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
