/**
 * Design spec: Style of a list of linked resources with action buttons
 */

import { useCallback, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import useSWR from "swr";

import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import useDebounce from "../hooks/useDebounce";
import useErrorBar from "../hooks/useErrorBar";
import supabase, { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";

export default function ProjectList() {
  const { session, username } = useAuth();
  const navigate = useNavigate();

  // ------------
  // Data loading
  // ------------

  const { data, isLoading, mutate } = useSWR(
    "/projects",
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*, user(id, username)");
      if (error) throw Error(String(error));
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

  if (session === null) {
    return (
      <Container>
        <Typography variant="h4">Projects</Typography>
        <Button
          sx={{ marginTop: "30px" }}
          variant="outlined"
          component={RouterLink}
          to="/log-in?redirect=/projects"
        >
          Log in
        </Button>
      </Container>
    );
  }

  // --------
  // Handlers
  // --------

  const handleCreateProject = async (name: string) => {
    const user_id = session?.user.id;
    if (!user_id) {
      throw Error("No user ID found");
    }
    const { data: project, error } = await supabase
      .from("project")
      .insert({
        name,
        user_id,
      })
      .select("*, user(id, username)")
      .single();
    // snackbar is handled by the calling dialog
    if (error || !project) throw error ?? "No project returned";
    mutate((data) => [...(data ?? []), project]);
    navigate(`/${project.user!.username}/${project.name}/files`);
  };

  // ------
  // Render
  // ------

  return (
    <Container>
      <Stack direction="row" spacing={4} alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Projects</Typography>

        <CreateDialog handleCreateProject={handleCreateProject} />
      </Stack>

      <Stack>
        {data && data.length === 0 && (
          <Typography>No projects found.</Typography>
        )}

        {data?.map((project) => {
          const projectPrefix = `${project.user!.username}/${project.name}`;
          return (
            <Stack
              direction="row"
              key={project.id}
              component={RouterLink}
              to={`/${projectPrefix}/files`}
              sx={{
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                ":last-child": {
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                },
                "&:not(:has(.actionButton:hover)):hover": {
                  backgroundColor: "rgba(144, 202, 249, 0.08);",
                },
              }}
            >
              <Box sx={{ flexGrow: 1, m: 2 }}>{project.name}</Box>
              <Button
                size="small"
                sx={{ m: 2 }}
                className="actionButton"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(`/${projectPrefix}/settings`);
                }}
              >
                <SettingsRoundedIcon sx={{ mr: 1 }} />
                Settings
              </Button>
            </Stack>
          );
        })}
      </Stack>

      {/* Spinner */}
      <LoadingFade isLoading={isLoading} />
    </Container>
  );
}

// ---------------
// More components
// ---------------

// TODO move to a shared component with File.tsx:DatasetDialog
function CreateDialog({
  handleCreateProject,
}: {
  handleCreateProject: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { showError } = useErrorBar();

  // null = valid; undefined = not checked; string = invalid
  const [validateMessage, setValidateMessage] = useState<
    string | null | undefined
  >(undefined);

  const validateExternal = useCallback(
    async (name: string) => {
      // TODO filter by project
      const { data, error } = await supabase
        .from("project")
        .select("id")
        .ilike("name", name)
        .limit(1);

      setIsValidating(false);

      if (error) {
        showError();
        throw error;
      }
      const isValid = data?.length === 0;
      setValidateMessage(isValid ? null : "Name is already in use.");
    },
    [showError]
  );

  const debouncedValidate = useDebounce(validateExternal);

  const handleValidate = async (newDatasetName: string) => {
    // TODO move cheap checks out of the debounced function
    const minLength = 3;

    if (newDatasetName.length < minLength) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage((m) =>
        m === undefined ? undefined : "Name must be at least 3 characters."
      );
      return;
    }

    // check length
    const byteSize = new Blob([newDatasetName]).size;
    if (byteSize > 63) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage("Name is too long.");
      return;
    }

    // check for invalid characters
    if (newDatasetName.indexOf("\u0000") !== -1) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage("Name include an invalid character \\u0000.");
      return;
    }

    setIsValidating(true);
    await debouncedValidate.call(newDatasetName);
  };

  return (
    <Box>
      <Button
        onClick={() => {
          setOpen(true);
          handleValidate(name);
        }}
      >
        <AddCircleOutlineRoundedIcon sx={{ mr: 1 }} /> New Project
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setValidateMessage(undefined);
        }}
        // https://github.com/mui/material-ui/issues/33004#issuecomment-1455260156
        disableRestoreFocus
        // // TODO for enter to submit, I'm getting an error turning this into a
        // // form. do it later.
        // PaperProps={{
        //   ...PaperProps,
        //   component: "form",
        //   onSubmit: async (event) => { ...
      >
        <DialogTitle>Create new project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the name for the new project.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            value={name}
            onChange={async (event) => {
              const newName = event.target.value;
              setName(newName);
              await handleValidate(newName);
            }}
            sx={{ mt: 2 }}
          />
          <Typography
            variant="caption"
            sx={{ pt: "10px", minHeight: "40px", display: "block" }}
          >
            {isValidating
              ? "Checking..."
              : validateMessage === undefined
              ? " "
              : validateMessage === null
              ? "OK!"
              : validateMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          {isCreating && <CircularProgress size={20} sx={{ mr: 2 }} />}
          <Button
            onClick={() => {
              setOpen(false);
              setValidateMessage(undefined);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              debouncedValidate.cancel();
              setIsCreating(true);
              try {
                await handleCreateProject(name);
              } catch (error) {
                setIsCreating(false);
                showError();
                throw error;
              }
              setIsCreating(false);
              setOpen(false);
              setName("");
            }}
            disabled={isValidating || validateMessage !== null || isCreating}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
