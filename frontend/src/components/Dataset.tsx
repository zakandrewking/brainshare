/**
 * Design Spec: Use this for
 * - loading a single item that can be deleted
 * - using two SWR calls with a dependency (necessary waterfall)
 */

import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import { Box, Breadcrumbs, Container, Link, Stack } from "@mui/material";

import useErrorBar from "../hooks/useErrorBar";
// import supabase, { supabaseData, useAuth } from "../supabase";
import supabase, { useAuth } from "../supabase";
import ConfirmDelete from "./ConfirmDelete";
import { Bold } from "./textComponents";
import { useEffect } from "react";

export default function Dataset() {
  const { id } = useParams();
  const { session } = useAuth();
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

  const { data: metadata } = useSWR(
    `/dataset_metadata/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("dataset_metadata")
        .select("*")
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

  // // load after metadata
  // const maxRows = 30;
  // const { data } = useSWR(
  //   metadata ? `/dataset/${metadata.table_name}?first=${maxRows}` : null,
  //   async () => {
  //     const { data, error } = await supabaseData
  //       .from(metadata?.table_name!)
  //       .select("*")
  //       .limit(maxRows);
  //     if (error) throw Error(String(error));
  //     return data;
  //   },
  //   {
  //     // Revalidate on mount (i.e. if stale) for data that can change without
  //     // user input
  //     revalidateIfStale: true,
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   }
  // );

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
        {/* {(data?.length || 0) === 0 ? (
          <Box>No data in this dataset</Box>
        ) : (
          "todo data"
        )} */}
        <Bold>Dataset Settings</Bold>
        <Box>
          <ConfirmDelete table="dataset" onConfirm={handleDelete} />
        </Box>
      </Stack>
    </Container>
  );
}
