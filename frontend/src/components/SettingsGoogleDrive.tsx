import PropTypes from "prop-types";
import {
  MouseEvent,
  KeyboardEvent,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import { CheckRounded, Close, Done, Settings } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  ClickAwayListener,
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
  InputBase,
  InputLabel,
  List,
  MenuItem,
  Paper,
  Popper,
  Select,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  AutocompleteChangeReason,
  autocompleteClasses,
} from "@mui/material/Autocomplete";
import { styled, useTheme } from "@mui/material/styles";

import { DefaultService } from "../client";
import { useAsyncEffect } from "../hooks/useAsyncEffect";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive, { GoogleDrive } from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
import { Paragraph } from "./textComponents";
import { Database } from "../database.types";

interface File {
  id: string;
  name: string;
}

type SyncedFolder = Database["public"]["Tables"]["synced_folder"]["Row"];

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
  syncedFolders: SyncedFolder[] | undefined;
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
  syncedFolders: SyncedFolder[] | undefined;
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
function FileSyncOptions() {
  return (
    <Stack gap={5}>
      <SelectFileTypes />
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

// const StyledAutocompletePopper = styled("div")(({ theme }) => ({
//   [`& .${autocompleteClasses.paper}`]: {
//     boxShadow: "none",
//     margin: 0,
//     color: "inherit",
//     fontSize: 13,
//   },
//   [`& .${autocompleteClasses.listbox}`]: {
//     backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
//     padding: 0,
//     [`& .${autocompleteClasses.option}`]: {
//       minHeight: "auto",
//       alignItems: "flex-start",
//       padding: 8,
//       borderBottom: `1px solid  ${
//         theme.palette.mode === "light" ? " #eaecef" : "#30363d"
//       }`,
//       '&[aria-selected="true"]': {
//         backgroundColor: "transparent",
//       },
//       [`&.${autocompleteClasses.focused}, &.${autocompleteClasses.focused}[aria-selected="true"]`]:
//         {
//           backgroundColor: theme.palette.action.hover,
//         },
//     },
//   },
//   [`&.${autocompleteClasses.popperDisablePortal}`]: {
//     position: "relative",
//   },
// }));

// function PopperComponent(props) {
//   const { disablePortal, anchorEl, open, ...other } = props;
//   return <StyledAutocompletePopper {...other} />;
// }

// PopperComponent.propTypes = {
//   anchorEl: PropTypes.any,
//   disablePortal: PropTypes.bool,
//   open: PropTypes.bool.isRequired,
// };

const StyledPopper = styled(Popper)(({ theme }) => ({
  border: `1px solid ${theme.palette.mode === "light" ? "#e1e4e8" : "#30363d"}`,
  boxShadow: `0 8px 24px ${
    theme.palette.mode === "light" ? "rgba(149, 157, 165, 0.2)" : "rgb(1, 4, 9)"
  }`,
  borderRadius: 6,
  width: 300,
  zIndex: theme.zIndex.modal,
  fontSize: 13,
  color: theme.palette.mode === "light" ? "#24292e" : "#c9d1d9",
  backgroundColor: theme.palette.mode === "light" ? "#fff" : "#1c2128",
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  padding: 10,
  width: "100%",
  borderBottom: `1px solid ${
    theme.palette.mode === "light" ? "#eaecef" : "#30363d"
  }`,
  "& input": {
    borderRadius: 4,
    backgroundColor: theme.palette.mode === "light" ? "#fff" : "#0d1117",
    padding: 8,
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    border: `1px solid ${
      theme.palette.mode === "light" ? "#eaecef" : "#30363d"
    }`,
    fontSize: 14,
    "&:focus": {
      boxShadow: `0px 0px 0px 3px ${
        theme.palette.mode === "light"
          ? "rgba(3, 102, 214, 0.3)"
          : "rgb(12, 45, 107)"
      }`,
      borderColor: theme.palette.mode === "light" ? "#0366d6" : "#388bfd",
    },
  },
}));

const GithubButton = styled(ButtonBase)(({ theme }) => ({
  fontSize: 13,
  width: "100%",
  textAlign: "left",
  paddingBottom: 8,
  color: theme.palette.mode === "light" ? "#586069" : "#8b949e",
  fontWeight: 600,
  "&:hover,&:focus": {
    color: theme.palette.mode === "light" ? "#0366d6" : "#58a6ff",
  },
  "& span": {
    width: "100%",
  },
  "& svg": {
    width: 16,
    height: 16,
  },
}));

interface Val {
  name: string;
  color: string;
  description: string;
}

/*
 * Select file types to automatically sync to datasets
 */
function SelectFileTypes() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [value, setValue] = useState<Val[]>([labels[0]]);
  const [pendingValue, setPendingValue] = useState<Val[]>([]);
  const theme = useTheme();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setPendingValue(value);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setValue(pendingValue);
    anchorEl?.focus();
    setAnchorEl(null);
  };

  const handleChange = (
    event: SyntheticEvent,
    newValue: Val[],
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
    setPendingValue(newValue);
  };

  const handleDelete = (event: any) => {
    console.log(event.target);
    setValue((chips) => chips.filter((chip) => true));
  };

  const open = Boolean(anchorEl);
  const id = open ? "github-label" : undefined;

  return (
    <>
      <Box sx={{ width: 221, fontSize: 13 }}>
        <GithubButton disableRipple aria-describedby={id} onClick={handleClick}>
          <span>Labels</span>
          <Settings />
        </GithubButton>
        {value.map((label) => (
          <Chip key={label.name} label={label.name} onDelete={handleDelete} />
        ))}
      </Box>
      <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start">
        <ClickAwayListener onClickAway={handleClose}>
          <Paper>
            <Box
              sx={{
                //   borderBottom: `1px solid ${
                //     theme.palette.mode === "light" ? "#eaecef" : "#30363d"
                //   }`,
                p: 1,
                //   fontWeight: 600,
              }}
            >
              Select file types
            </Box>
            <Autocomplete
              open
              multiple
              onClose={(event, reason) => {
                if (reason === "escape") {
                  handleClose();
                }
              }}
              value={pendingValue}
              onChange={handleChange}
              disableCloseOnSelect
              // PopperComponent={PopperComponent}
              renderTags={() => null}
              noOptionsText="No labels"
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
                  // component="span"
                  // sx={{
                  //   width: 14,
                  //   height: 14,
                  //   flexShrink: 0,
                  //   borderRadius: "3px",
                  //   mr: 1,
                  //   mt: "2px",
                  // }}
                  // style={{ backgroundColor: option.color }}
                  />
                  <Box
                    sx={{
                      flexGrow: 1,
                      "& span": {
                        color:
                          theme.palette.mode === "light"
                            ? "#586069"
                            : "#8b949e",
                      },
                    }}
                  >
                    {option.name}
                    <br />
                    <span>{option.description}</span>
                  </Box>
                  <Box
                    component={Close}
                    // sx={{ opacity: 0.6, width: 18, height: 18 }}
                    style={{
                      visibility: selected ? "visible" : "hidden",
                    }}
                  />
                </li>
              )}
              options={[...labels].sort((a, b) => {
                // Display the selected labels first.
                let ai = value.indexOf(a);
                ai = ai === -1 ? value.length + labels.indexOf(a) : ai;
                let bi = value.indexOf(b);
                bi = bi === -1 ? value.length + labels.indexOf(b) : bi;
                return ai - bi;
              })}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <StyledInput
                  ref={params.InputProps.ref}
                  inputProps={params.inputProps}
                  autoFocus
                  placeholder="Filter labels"
                />
              )}
            />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

// From https://github.com/abdonrd/github-labels
const labels: Val[] = [
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
//   {
//     name: "help wanted",
//     color: "#008672",
//     description: "Extra attention is needed",
//   },
//   {
//     name: "priority: critical",
//     color: "#b60205",
//     description: "",
//   },
//   {
//     name: "priority: high",
//     color: "#d93f0b",
//     description: "",
//   },
//   {
//     name: "priority: low",
//     color: "#0e8a16",
//     description: "",
//   },
//   {
//     name: "priority: medium",
//     color: "#fbca04",
//     description: "",
//   },
//   {
//     name: "status: can't reproduce",
//     color: "#fec1c1",
//     description: "",
//   },
//   {
//     name: "status: confirmed",
//     color: "#215cea",
//     description: "",
//   },
//   {
//     name: "status: duplicate",
//     color: "#cfd3d7",
//     description: "This issue or pull request already exists",
//   },
//   {
//     name: "status: needs information",
//     color: "#fef2c0",
//     description: "",
//   },
//   {
//     name: "status: wont do/fix",
//     color: "#eeeeee",
//     description: "This will not be worked on",
//   },
//   {
//     name: "type: bug",
//     color: "#d73a4a",
//     description: "Something isn't working",
//   },
//   {
//     name: "type: discussion",
//     color: "#d4c5f9",
//     description: "",
//   },
//   {
//     name: "type: documentation",
//     color: "#006b75",
//     description: "",
//   },
//   {
//     name: "type: enhancement",
//     color: "#84b6eb",
//     description: "",
//   },
//   {
//     name: "type: epic",
//     color: "#3e4b9e",
//     description: "A theme of work that contain sub-tasks",
//   },
//   {
//     name: "type: feature request",
//     color: "#fbca04",
//     description: "New feature or request",
//   },
//   {
//     name: "type: question",
//     color: "#d876e3",
//     description: "Further information is requested",
//   },
// ];
