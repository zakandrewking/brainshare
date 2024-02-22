import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import { CheckBox, CheckRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
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
  MenuItem,
  Select,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { DefaultService } from "../client";
import { useAsyncEffect } from "../hooks/useAsyncEffect";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive, { GoogleDrive } from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
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

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    if (!session) navigate("/log-in?redirect=/account/google-drive");
  }, [session, navigate]);

  // ------------
  // Data loading
  // ------------

  const {
    data: syncedFolders,
    isLoading: syncedFoldersIsLoading,
    mutate,
  } = useSWR("/synced_folder?source=google_drive", async () => {
    const { data, error } = await supabase
      .from("synced_folder")
      .select("*")
      .filter("source", "eq", "google_drive");
    if (error) {
      console.error(error);
      throw Error("Could not fetch synced folders");
    }
    return data;
  });

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
          (data) =>
            R.reject(data || [], (n) => n.remote_id === confirmedDeleteId),
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

  // ------------------
  // Computed variables
  // ------------------

  const initialIndex =
    google.accessToken === null ? 0 : (syncedFolders?.length || 0) > 0 ? 2 : 1;

  // --------
  // Handlers
  // --------

  const handleUpdateSyncedFolders = async (
    checked: boolean,
    fileId: string
  ) => {
    if (checked) {
      const { data: newFolder, error } = await supabase
        .from("synced_folder")
        .insert({
          user_id: session!.user.id,
          remote_id: fileId,
          source: "google_drive",
          name:
            R.find(files || [], (n) => n.id === fileId)?.name || "<unknown>",
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
  // ------
  // Render
  // ------

  return (
    <>
      <Container>
        <Typography variant="h4">Configure Google Drive</Typography>
        {google.isLoading || syncedFoldersIsLoading ? (
          <Fade
            in={google.isLoading}
            style={{
              transitionDelay: google.isLoading ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        ) : (
          <ResponsiveStepper
            google={google}
            setFiles={setFiles}
            syncedFolders={syncedFolders}
            initialIndex={initialIndex}
            files={files}
            handleUpdateSyncedFolders={handleUpdateSyncedFolders}
          />
        )}
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

/**
 * Buttons to connect and disconnect Google Drive
 */
function ConnectGoogleDrive({
  google,
  setFiles,
}: {
  google: GoogleDrive;
  setFiles: (files: File[] | null) => void;
}) {
  return (
    <Box display="inline-block">
      <Stack spacing={5}>
        <Button
          onClick={google.signIn}
          disabled={google.isLoading || google.accessToken !== null}
          variant="contained"
          disableElevation
        >
          Connect Google Drive
        </Button>
        <Button
          onClick={async () => {
            setFiles(null);
            await google.signOut();
          }}
          disabled={google.isLoading || google.accessToken === null}
          variant="contained"
          disableElevation
        >
          Disconnect Google Drive
        </Button>
      </Stack>
    </Box>
  );
}

function ResponsiveStepper({
  google,
  setFiles,
  syncedFolders,
  files,
  initialIndex = 0,
  handleUpdateSyncedFolders,
}: {
  google: GoogleDrive;
  files: File[] | null;
  setFiles: (files: File[] | null) => void;
  syncedFolders: any[] | undefined;
  initialIndex?: number;
  handleUpdateSyncedFolders: (checked: boolean, fileId: string) => void;
}) {
  const [activeStep, setActiveStep] = useState(initialIndex);
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const steps = [
    <Stack direction="row" alignItems="center">
      {initialIndex > 0 && <CheckRounded sx={{ mx: 1 }} />}
      Connect Google Drive
    </Stack>,
    <Stack direction="row" alignItems="center">
      {initialIndex > 1 && <CheckRounded sx={{ mx: 1 }} />}
      Choose folders
    </Stack>,
    "File sync options",
  ];

  const content = (
    <ConfigureGoogleStep
      activeStep={activeStep}
      numSteps={steps.length}
      google={google}
      files={files}
      syncedFolders={syncedFolders}
      setFiles={setFiles}
      handleBack={handleBack}
      handleNext={handleNext}
      handleUpdateSyncedFolders={handleUpdateSyncedFolders}
    />
  );

  return (
    <Box sx={{ mt: 5, maxWidth: "800px" }}>
      <Stepper
        activeStep={activeStep}
        orientation={sm ? "vertical" : "horizontal"}
      >
        {steps.map((label, i) => {
          return (
            <Step key={i} completed={false} disabled={false}>
              <StepLabel
                onClick={() => setActiveStep(i)}
                sx={{ cursor: "pointer" }}
              >
                {label}
              </StepLabel>
              {sm && activeStep === i && (
                <StepContent sx={{ pt: 5 }}>{content}</StepContent>
              )}
            </Step>
          );
        })}
      </Stepper>
      {!sm && <Box sx={{ p: 5 }}>{content}</Box>}
    </Box>
  );
}

/*
 * First page: Configure Google Drive
 */
function ConfigureGoogleStep({
  activeStep,
  numSteps,
  google,
  files,
  syncedFolders,
  setFiles,
  handleBack,
  handleNext,
  handleUpdateSyncedFolders,
}: {
  activeStep: number;
  numSteps: number;
  google: GoogleDrive;
  files: File[] | null;
  syncedFolders: any[] | undefined;
  setFiles: (files: File[] | null) => void;
  handleBack: () => void;
  handleNext: () => void;
  handleUpdateSyncedFolders: (checked: boolean, fileId: string) => void;
}) {
  return (
    <>
      {activeStep === 0 && (
        <ConnectGoogleDrive google={google} setFiles={setFiles} />
      )}
      {activeStep === 1 && (
        <ChooseFolders
          files={files}
          syncedFolders={syncedFolders}
          handleUpdateSyncedFolders={handleUpdateSyncedFolders}
        />
      )}
      {activeStep === 2 && <FileSyncOptions />}
      <Box sx={{ display: "flex", flexDirection: "row", pt: 5 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button onClick={handleNext} disabled={activeStep === numSteps - 1}>
          Next
        </Button>
      </Box>
    </>
  );
}

/**
 * Second page: choose folders to sync
 */
function ChooseFolders({
  files,
  syncedFolders,
  handleUpdateSyncedFolders,
}: {
  files: File[] | null;
  syncedFolders: any[] | undefined;
  handleUpdateSyncedFolders: (checked: boolean, fileId: string) => void;
}) {
  return (
    <List>
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
                  handleUpdateSyncedFolders(checked, file.id)
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
    </List>
  );
}

/**
 * Third page: options and link to view files
 */
function FileSyncOptions() {
  return (
    <Stack gap={5}>
      <FormControlLabel
        label={"Sync TSV automatically"}
        control={<Checkbox />}
        // checked={syncedFolders?.some(
        //   (syncedFolder) => syncedFolder.remote_id === file.id
        // )}
        // onChange={(_, checked) =>
        //   handleUpdateSyncedFolders(checked, file.id)
        // }
      />
      <Box>
        <Button
          to="/files"
          component={RouterLink}
          variant="contained"
          disableElevation
          sx={{ mr: 1 }}
        >
          Go to Files
        </Button>{" "}
        to see your synced files
      </Box>
    </Stack>
  );
}
