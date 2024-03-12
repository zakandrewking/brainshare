import {
  KeyboardEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import { CheckRounded, Done } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { AutocompleteChangeReason } from "@mui/material/Autocomplete";
import { useTheme } from "@mui/material/styles";

import { DefaultService } from "../client";
import { Database } from "../database.types";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive, { GoogleDrive } from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
import { Paragraph } from "./textComponents";
import LoadingFade from "./shared/LoadingFade";

interface AutoSyncOption {
  name: string;
  color: string;
  description: string;
}

const autoSyncOptions: AutoSyncOption[] = [
  {
    name: ".tsv",
    color: "#3e4b9e",
    description: "Tab-separated values",
  },
  {
    name: ".csv",
    color: "#3e4b9e",
    description: "Tab-separated values",
  },
];

interface File {
  id: string;
  name: string;
}

type SyncedFolder = Database["public"]["Tables"]["synced_folder"]["Row"];
type SyncOptions = Database["public"]["Tables"]["sync_options"]["Row"];

export default function SettingsGoogleDrive() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const google = useGoogleDrive();
  const { showError } = useErrorBar();
  const [checkDeleteId, setCheckDeleteId] = useState<string | null>(null);

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
    mutate: syncedFoldersMutate,
  } = useSWR(
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
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // get sync_options
  const {
    data: syncOptions,
    isLoading: syncOptionsIsLoading,
    mutate: syncOptionsMutate,
  } = useSWR(
    "/sync_options&source=google_drive",
    async () => {
      const { data, error } = await supabase
        .from("sync_options")
        .select()
        .filter("source", "eq", "google_drive")
        .filter("project_id", "is", null)
        .maybeSingle();
      if (error) {
        console.error(error);
        throw Error("Could not fetch sync options");
      }
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // On access token change, check for drive access
  const { data: files } = useSWR(
    google.gapi && google.gapi.client ? "/google-drive/root-folders" : null,
    async () => {
      // list folders in the root of My Drive
      const response = await google.gapi.client.drive.files.list({
        q: "'root' in parents and mimeType = 'application/vnd.google-apps.folder'",
        orderBy: "name",
        fields: "files(id, name)",
        pageSize: 100,
      });
      // ignore folders starting with "."
      const files = (response.result.files as File[]).filter(
        (x) => !x.name.startsWith(".")
      );
      return files;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // ------------------
  // Computed variables
  // ------------------

  const initialIndex =
    google.accessToken === null ? 0 : (syncedFolders?.length || 0) > 0 ? 2 : 1;

  const isLoading =
    google.isLoading || syncedFoldersIsLoading || syncOptionsIsLoading;

  // --------
  // Handlers
  // --------

  const handleDeleteSyncedFolder = async (remoteId: string) => {
    const { error } = await supabase
      .from("synced_folder")
      .delete()
      .match({ user_id: session!.user.id, remote_id: remoteId });
    // close the dialog
    setCheckDeleteId(null);
    if (error) {
      console.error(error);
      showError();
      throw Error("Could not delete synced folder");
    }
    syncedFoldersMutate(
      (data) => R.reject(data || [], (n) => n.remote_id === remoteId),
      false
    );
  };

  const handleUpdateSyncedFolders = async (
    checked: boolean,
    fileId: string
  ) => {
    if (checked) {
      const { data: newFolder, error } = await supabase
        .from("synced_folder")
        .upsert(
          {
            user_id: session!.user.id,
            remote_id: fileId,
            source: "google_drive",
            name:
              R.find(files || [], (n) => n.id === fileId)?.name || "<unknown>",
            project_id: null,
          },
          {
            onConflict: "user_id,source,remote_id",
            ignoreDuplicates: false,
          }
        )
        .select("*")
        .single();
      if (error) {
        console.error(error);
        showError();
        throw Error("Could not insert synced folder");
      }
      syncedFoldersMutate((sf) => [...sf!, newFolder], false);

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

  const handleUpdateSyncOptions = async (autoSyncExtensions: string[]) => {
    const { error } = await supabase.from("sync_options").upsert(
      {
        user_id: session!.user.id,
        source: "google_drive",
        auto_sync_extensions: autoSyncExtensions,
        has_seen_sync_options: true,
      },
      {
        onConflict: "user_id,project_id,source",
        // update matching rows
        ignoreDuplicates: false,
      }
    );
    if (error) {
      console.error(error);
      showError();
      throw Error("Could not update sync options");
    }
    syncOptionsMutate(
      (options) => ({
        ...options!,
        auto_sync_extensions: autoSyncExtensions,
        has_seen_sync_options: true,
      }),
      false
    );
  };

  // When the user has visited the sync options page, update the
  // has_seen_sync_options and we will kick off sync jobs
  const handleHasSeenSyncOptions = useMemo(
    () => async () => {
      const { error } = await supabase.from("sync_options").upsert(
        {
          user_id: session!.user.id,
          source: "google_drive",
          has_seen_sync_options: true,
        },
        {
          onConflict: "user_id,project_id,source",
          // update matching rows
          ignoreDuplicates: false,
        }
      );
      if (error) {
        console.error(error);
        throw Error("Could not update sync options");
      }
      syncOptionsMutate(
        (options) => ({ ...options!, has_seen_sync_options: true }),
        false
      );
    },
    [session, syncOptionsMutate]
  );

  // ------
  // Render
  // ------

  return (
    <>
      <Container>
        <Typography variant="h4">Configure Google Drive</Typography>
        {/* Spinner */}
        <LoadingFade isLoading={isLoading} />
        {!isLoading && (
          <ResponsiveStepper
            google={google}
            syncedFolders={syncedFolders}
            initialIndex={initialIndex}
            files={files ?? null}
            syncOptions={syncOptions}
            handleUpdateSyncedFolders={handleUpdateSyncedFolders}
            handleUpdateSyncOptions={handleUpdateSyncOptions}
            handleHasSeenSyncOptions={handleHasSeenSyncOptions}
          />
        )}
      </Container>

      {/* Dialogs */}
      <Dialog
        open={checkDeleteId !== null}
        onClose={() => {
          setCheckDeleteId(null);
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
              setCheckDeleteId(null);
            }}
          >
            No, keep keep syncing
          </Button>
          <Button
            onClick={() => {
              handleDeleteSyncedFolder(checkDeleteId!);
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
function ConnectGoogleDrive({ google }: { google: GoogleDrive }) {
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
          onClick={google.signOut}
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
  syncedFolders,
  files,
  syncOptions,
  initialIndex = 0,
  handleUpdateSyncedFolders,
  handleUpdateSyncOptions,
  handleHasSeenSyncOptions,
}: {
  google: GoogleDrive;
  files: File[] | null;
  syncOptions: SyncOptions | undefined | null;
  syncedFolders: SyncedFolder[] | undefined;
  initialIndex?: number;
  handleUpdateSyncedFolders: (checked: boolean, fileId: string) => void;
  handleUpdateSyncOptions: (autoSyncExtensions: string[]) => void;
  handleHasSeenSyncOptions: () => void;
}) {
  const [activeStep, setActiveStep] = useState(initialIndex);
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (activeStep === 2) {
      handleHasSeenSyncOptions();
    }
  }, [activeStep, handleHasSeenSyncOptions]);

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
      syncOptions={syncOptions}
      syncedFolders={syncedFolders}
      handleBack={handleBack}
      handleNext={handleNext}
      handleUpdateSyncedFolders={handleUpdateSyncedFolders}
      handleUpdateSyncOptions={handleUpdateSyncOptions}
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
  syncOptions,
  handleBack,
  handleNext,
  handleUpdateSyncedFolders,
  handleUpdateSyncOptions,
}: {
  activeStep: number;
  numSteps: number;
  google: GoogleDrive;
  files: File[] | null;
  syncedFolders: SyncedFolder[] | undefined;
  syncOptions: SyncOptions | undefined | null;
  handleBack: () => void;
  handleNext: () => void;
  handleUpdateSyncedFolders: (checked: boolean, fileId: string) => void;
  handleUpdateSyncOptions: (autoSyncExtensions: string[]) => void;
}) {
  return (
    <>
      {activeStep === 0 && <ConnectGoogleDrive google={google} />}
      {activeStep === 1 && (
        <ChooseFolders
          files={files}
          syncedFolders={syncedFolders}
          handleUpdateSyncedFolders={handleUpdateSyncedFolders}
        />
      )}
      {activeStep === 2 && (
        <FileSyncOptions
          syncOptions={syncOptions}
          handleUpdateSyncOptions={handleUpdateSyncOptions}
        />
      )}
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
  syncedFolders: SyncedFolder[] | undefined;
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
function FileSyncOptions({
  syncOptions,
  handleUpdateSyncOptions,
}: {
  syncOptions: SyncOptions | undefined | null;
  handleUpdateSyncOptions: (autoSyncExtensions: string[]) => void;
}) {
  return (
    <Stack gap={5}>
      <SelectFileTypes
        syncOptions={syncOptions}
        handleUpdateSyncOptions={handleUpdateSyncOptions}
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

/*
 * Select file types to automatically sync to datasets
 */
function SelectFileTypes({
  syncOptions,
  handleUpdateSyncOptions,
}: {
  syncOptions: SyncOptions | undefined | null;
  handleUpdateSyncOptions: (autoSyncExtensions: string[]) => void;
}) {
  const currentAutoSync = autoSyncOptions.filter(
    (val) => syncOptions?.auto_sync_extensions?.indexOf(val.name) !== -1
  );
  const [autoSync, setAutoSync] = useState<AutoSyncOption[]>(currentAutoSync);
  const [pendingAutoSync, setPendingAutoSync] =
    useState<AutoSyncOption[]>(currentAutoSync);
  const theme = useTheme();

  const handleClose = async () => {
    setAutoSync(pendingAutoSync);
    handleUpdateSyncOptions(pendingAutoSync.map((val) => val.name));
  };

  const handleChange = (
    event: SyntheticEvent,
    newValues: AutoSyncOption[],
    reason: AutocompleteChangeReason
  ) => {
    if (
      ((event.type === "keydown" &&
        (event as KeyboardEvent)?.key === "Backspace") ||
        (event as KeyboardEvent)?.key === "Delete") &&
      reason === "removeOption"
    ) {
      return;
    }
    setPendingAutoSync(newValues);
  };

  const handleDelete = (val: AutoSyncOption) => {
    const newVals = autoSync.filter((chip) => chip.name !== val.name);
    setAutoSync(newVals);
    setPendingAutoSync(newVals);
    handleUpdateSyncOptions(newVals.map((val) => val.name));
  };

  return (
    <Card sx={{ p: 4 }} variant="outlined">
      <CardHeader
        title="Automatically process files"
        subheader="These files read by brainshare and their data will be written into datasets automatically."
      ></CardHeader>
      <CardContent>
        <Stack spacing={4}>
          <Autocomplete
            multiple
            value={pendingAutoSync}
            onClose={handleClose}
            onChange={handleChange}
            disableCloseOnSelect
            disableClearable
            openOnFocus
            // Don't render the chips inside the input
            renderTags={() => null}
            noOptionsText="None found"
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Box
                  component={Done}
                  sx={{ width: 17, height: 17, mr: "5px", ml: "-2px" }}
                  style={{
                    visibility: selected ? "visible" : "hidden",
                  }}
                />
                <Box
                  sx={{
                    flexGrow: 1,
                    "& span": {
                      color:
                        theme.palette.mode === "light" ? "#586069" : "#8b949e",
                    },
                  }}
                >
                  {option.name}
                  <br />
                  <span>{option.description}</span>
                </Box>
              </li>
            )}
            options={[...autoSyncOptions].sort((a, b) => {
              // Display the selected labels first.
              let ai = autoSync.indexOf(a);
              ai =
                ai === -1 ? autoSync.length + autoSyncOptions.indexOf(a) : ai;
              let bi = autoSync.indexOf(b);
              bi =
                bi === -1 ? autoSync.length + autoSyncOptions.indexOf(b) : bi;
              return ai - bi;
            })}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label="Extensions" placeholder=".csv" />
            )}
          />
          <Box>
            {autoSync.length > 0 ? (
              <>
                <Typography variant="body2">
                  The following file types will be automatically processed:
                </Typography>
                <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                  {autoSync.map((val) => (
                    <Chip
                      key={val.name}
                      label={val.name}
                      onDelete={() => handleDelete(val)}
                    />
                  ))}
                </Stack>
              </>
            ) : (
              <Typography variant="body2">
                No file types will be automatically processed.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
