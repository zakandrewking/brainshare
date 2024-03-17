import { Box, Container, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";
import supabase, { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";
import ConfirmDelete from "./ConfirmDelete";
import { DefaultService } from "../client";
import { useEffect } from "react";

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

  const { data: project, isLoading } = useSWR(
    id ? `/project/${id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("project")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleDelete = async () => {
    if (!project) return; // button disabled below
    // Call the backend to delete both the project and the schema. ConfirmDelete
    // will catch any errors and show a snackbar.
    // await DefaultService.postDeleteProject({ id: project.id });
    mutate("/projects", (data: any) => {
      return data.filter((p: any) => p.id !== project.id);
    });
    navigate("/projects");
  };

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
      <LoadingFade isLoading={isLoading} />
    </Container>
  );
}
