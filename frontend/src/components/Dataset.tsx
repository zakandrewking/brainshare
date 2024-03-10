/**
 * Design Spec: Use this for
 * - loading a single item that can be deleted
 * - using two SWR calls with a dependency (necessary waterfall)
 */

import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  Link,
  Stack,
} from "@mui/material";

import useErrorBar from "../hooks/useErrorBar";
import supabase, { useAuth } from "../supabase";
import ConfirmDelete from "./ConfirmDelete";
import LoadingFade from "./shared/LoadingFade";
import { Bold } from "./textComponents";
import { DefaultService } from "../client";
import TaskStatusButton from "./shared/TaskStatusButton";

export default function Dataset() {
  const { id } = useParams();
  const { session, dataClient } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    if (!session) navigate(`/log-in?redirect=/dataset/${id}`);
  }, [session, navigate, id]);

  // ------------
  // Data loading
  // ------------

  const { data: metadata, isLoading: isLoadingMetadata } = useSWR(
    `/dataset_metadata/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("dataset_metadata")
        .select("*, synced_file_dataset_metadata(*, synced_file(*))")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // load after metadata
  const maxRows = 30;
  const { data, isLoading: isLoadingPreview } = useSWR(
    metadata && dataClient
      ? `/dataset/${metadata.table_name}?first=${maxRows}`
      : null,
    async () => {
      const { data, error } = await dataClient!
        .from(metadata!.table_name)
        .select("*")
        .limit(maxRows);
      if (error) throw Error(String(error));
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // --------
  // Handlers
  // --------

  const handleDelete = async () => {
    const { error } = await supabase
      .from("dataset_metadata")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id!);
    if (error) {
      showError();
      throw Error(String(error));
    }
    mutate("/datasets", async (data) => {
      return data?.filter((row: any) => row.id !== id);
    });
    navigate("/datasets");
  };

  // ------------------
  // Computed variables
  // ------------------

  const isLoading = isLoadingMetadata || isLoadingPreview;

  // ------
  // Render
  // ------

  return (
    <Container>
      <Stack spacing={2}>
        <Box sx={{ marginBottom: "10px" }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/datasets">
              Datasets
            </Link>
            <Bold>{metadata?.name}</Bold>
          </Breadcrumbs>
        </Box>
        <Bold>Status</Bold>
        <Bold>Files</Bold>
        <Box>
          {metadata?.synced_file_dataset_metadata?.map((sfdm) => {
            const sf = sfdm.synced_file;
            if (!sf) return null;
            return (
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to={`/file/${sf.id}`}
                  key={sf.id}
                >
                  {sf.name}
                </Button>
                <TaskStatusButton
                  taskLinkRefTable="synced_file_dataset_metadata"
                  taskLinkRefColumn="sync_file_to_dataset_task_link_id"
                  taskLinkRefId={sfdm.id}
                  taskType="sync_file_to_dataset"
                  handleCreateTask={(clean_up_only: boolean = false) => {
                    return DefaultService.postTaskSyncFileToDataset({
                      synced_file_dataset_metadata_id: sfdm.id,
                      clean_up_only: clean_up_only,
                    });
                  }}
                />
              </Box>
            );
          })}
        </Box>
        <Bold>Preview</Bold>
        <LoadingFade isLoading={isLoading} center />
        {data?.map((row: any) => (
          <Box key={row.id}>{JSON.stringify(row)}</Box>
        ))}
        <Bold>Dataset Settings</Bold>
        <Box>
          <ConfirmDelete table="dataset" onConfirm={handleDelete} />
        </Box>
      </Stack>
    </Container>
  );
}
