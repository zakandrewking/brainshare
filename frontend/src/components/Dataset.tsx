/**
 * Design Spec: Use this for
 * - loading a single item that can be deleted
 * - using two SWR calls with a dependency (necessary waterfall)
 */

import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { Box, Breadcrumbs, Button, Container, Link } from "@mui/material";

import supabase, { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";
import TableView from "./shared/TableView";
import { Bold } from "./textComponents";
import { DefaultService } from "../client";

export default function Dataset() {
  const { id } = useParams();
  const { session, dataClient } = useAuth();
  const navigate = useNavigate();

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

  const {
    data: metadata,
    isLoading: metadataIsLoading,
    error: metadataError,
  } = useSWR(
    `/dataset_metadata/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("dataset_metadata")
        .select("*, synced_file_dataset_metadata(*, synced_file(*))")
        .eq("id", id!)
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
  const {
    data,
    isLoading: previewIsLoading,
    error: previewError,
  } = useSWR(
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

  // if there are no results, let's get the columns
  const { data: columnsData, isLoading: columnsIsLoading } = useSWR(
    data && data.length === 0 ? `/dataset_metadata/${id}/columns` : null,
    async () => {
      const columns = await DefaultService.postDatasetColumns({
        dataset_metadata_id: Number(id!),
      });
      return columns;
    }
  );

  // ------------------
  // Computed variables
  // ------------------

  const isLoading = metadataIsLoading || previewIsLoading || columnsIsLoading;
  const hasError = metadataError || previewError;

  const rows = data;
  const mappedColumnsData = columnsData?.map((field) => ({ field }));
  const columns =
    data && data?.length > 0
      ? Object.keys(data[0]).map((field) => ({ field }))
      : mappedColumnsData;

  // ------
  // Render
  // ------

  return (
    <Container
      sx={{
        // full height content
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
      }}
    >
      <Box
        sx={{
          marginBottom: "10px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/datasets">
            Datasets
          </Link>
          <Bold>{metadata?.name}</Bold>
        </Breadcrumbs>
        <Button component={RouterLink} to={`/dataset/${id}/settings`}>
          <SettingsRoundedIcon sx={{ marginRight: 1 }} />
          Settings
        </Button>
      </Box>

      {/* Spinners */}
      <LoadingFade isLoading={isLoading} center />

      {/* Error */}
      {hasError && <Box>Could not load data</Box>}

      {columns && <TableView columns={columns} rows={rows ?? []} />}
    </Container>
  );
}
