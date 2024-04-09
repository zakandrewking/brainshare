import { Box, Container, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { mutate } from "swr";
import { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";
import ConfirmDelete from "./ConfirmDelete";
import { useEffect } from "react";
import useCurrentProject from "../hooks/useCurrentProject";
import { Error404 } from "./errors";
import { DefaultService } from "../client";

export default function ProjectSettings() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    if (session === null) navigate(`/log-in?redirect=/project/${id}/settings`);
  }, [session, navigate, id]);

  // ------------
  // Data loading
  // ------------

  const { project, currentProjectIsLoading } = useCurrentProject();

  // --------
  // Handlers
  // --------

  const handleDelete = async () => {
    if (!project) return; // button disabled below
    // Call the backend to delete both the project and the schema. ConfirmDelete
    // will catch any errors and show a snackbar.
    await DefaultService.postDeleteProject({ project_id: project.id });
    mutate("/projects", (data: any) => {
      return data.filter((p: any) => p.id !== project.id);
    });
    navigate("/projects");
  };

  const handleRename = async () => {
    // TODO
  };

  // ------------
  // Error checks
  // ------------

  if (project === null) {
    return <Error404 />;
  }

  // ------
  // Render
  // ------

  return (
    <Container>
      <Typography variant="h4">Project Settings</Typography>
      <Typography sx={{ mt: 2 }}>Project name: {project?.name}</Typography>
      <p>Project ID: {project?.id}</p>
      <Stack spacing={1}>
        <Typography variant="h6">Danger Zone</Typography>
        <Box>
          <ConfirmDelete
            resource="project"
            onConfirm={handleDelete}
            disabled={!project}
          />
        </Box>
      </Stack>
      {/* Spinner */}
      <LoadingFade isLoading={currentProjectIsLoading} />
    </Container>
  );
}
