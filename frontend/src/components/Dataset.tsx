/**
 * Design Spec: Use this for
 * - loading a single item that can be deleted
 * - using two SWR calls with a dependency (necessary waterfall)
 */

import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import { Box, Breadcrumbs, Container, Link, Stack } from "@mui/material";

import useErrorBar from "../hooks/useErrorBar";
import supabase, { supabaseData, useAuth } from "../supabase";
import ConfirmDelete from "./ConfirmDelete";
import { Bold } from "./textComponents";

export default function DatasetList() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useErrorBar();

  const { data: metadata } = useSWR(
    `/dataset_metadata/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("dataset_metadata")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // load after metadata
  const maxRows = 30;
  const { data } = useSWR(
    metadata ? `/dataset/${metadata.table_name}?first=${maxRows}` : null,
    async () => {
      const { data, error } = await supabaseData
        .from(metadata?.table_name!)
        .select("*")
        .limit(maxRows);
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: false,
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
      .eq("id", id);
    if (error) {
      showError();
      throw Error(String(error));
    }
    mutate("/datasets", async (data) => {
      return data?.filter((row: any) => row.id !== id);
    });
    navigate("/datasets");
  };

  return (
    <Container>
      <Stack spacing={4}>
        <Box sx={{ marginBottom: "10px" }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link component={RouterLink} to="/datasets">
              Datasets
            </Link>
            <Bold>{metadata?.name}</Bold>
          </Breadcrumbs>
        </Box>
        <Bold>Status</Bold>
        TODO
        <Bold>Files</Bold>
        TODO
        <Bold>Preview</Bold>
        {(data?.length || 0) === 0 ? (
          <Box>No data in this dataset</Box>
        ) : (
          "todo data"
        )}
        <Bold>Dataset Settings</Bold>
        <Box>
          <ConfirmDelete table="dataset" onConfirm={handleDelete} />
        </Box>
      </Stack>
    </Container>
  );
}
