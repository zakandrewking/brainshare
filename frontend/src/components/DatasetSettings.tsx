import { useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";

import {
  Box,
  Breadcrumbs,
  Container,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import { DefaultService } from "../client";
import useApiKey from "../hooks/useApiKey";
import supabase, { GATEWAY_URL, useAuth } from "../supabase";
import ConfirmDelete from "./ConfirmDelete";
import Code from "./shared/Code";
import { Bold } from "./textComponents";

export default function DatasetSettings() {
  const { id } = useParams();
  const { session, dataClient } = useAuth();
  const navigate = useNavigate();

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    // TODO avoid a redirect by waiting a sec for session to show up.
    // how do i do that?
    if (session === null) navigate(`/log-in?redirect=/dataset/${id}/settings`);
  }, [session, navigate, id]);

  // ------------
  // Data loading
  // ------------

  const { data: metadata } = useSWR(
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

  const { data: apiKeyData } = useApiKey(session?.user.id);

  // ------------------
  // Computed variables
  // ------------------

  const apiKey = apiKeyData?.value;
  const dataClientAuthHeader = dataClient?.headers["Authorization"];

  // --------
  // Handlers
  // --------

  const handleDelete = async () => {
    if (!metadata) return; // button disabled below
    // Call the backend to delete both the metadata and the table. ConfirmDelete
    // will catch any errors and show a snackbar.
    await DefaultService.postDeleteDataset({
      dataset_metadata_id: metadata.id,
    });
    mutate("/datasets", async (data) => {
      return data?.filter((row: any) => row.id !== id);
    });
    navigate("/datasets");
  };

  // ------
  // Render
  // ------

  return (
    <Container sx={{ pb: 3 }}>
      <Stack spacing={5}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/datasets">
            Datasets
          </Link>
          <Link component={RouterLink} to={`/dataset/${id}`}>
            {metadata?.table_name}
          </Link>
          <Bold>Settings</Bold>
        </Breadcrumbs>

        <Stack>
          <Typography variant="h6">Access from your code</Typography>
          <Code>
            python:
            <br />
            import brainshare as br
            <br />
            ds = br.Dataset("{metadata?.table_name}")
            <br />
            ds.head()
            <br />
            <br />
            curl:
            <br />
            curl -X POST -H "Authorization : Bearer "
            https://api.brainshare.io/dataset/{metadata?.id}/head
            <br />
            <br />
            openapi:
            <br />
            curl -X GET -H "Accept-Profile: {metadata?.schema_name}" -H
            "x-api-key:{apiKey || "YOUR_KEY"}" -H "Authorization:{" "}
            {dataClientAuthHeader || "Bearer DATA_TOKEN"}" {GATEWAY_URL}
            {/* TODO map x-api-key to JWT with https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html */}
            {/* or maybe use the actual JWT AND the x-api-key. could even obfuscate the JWT and recover using mapping templates */}
            {/* for now, we'll send the JWT as Authorization: Bearer */}
            {/* tl;dr api gateway cannot check a database and postgrest needs it too and we still need a rate limiter because we have shared compute */}
          </Code>
        </Stack>
        <Stack spacing={1}>
          <Typography variant="h6">Danger Zone</Typography>
          <Box>
            <ConfirmDelete
              resource="dataset"
              onConfirm={handleDelete}
              disabled={!metadata}
            />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
