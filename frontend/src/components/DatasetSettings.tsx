import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Bold } from "./textComponents";
import useSWR, { mutate } from "swr";
import supabase, { useAuth, GATEWAY_URL } from "../supabase";
import useErrorBar from "../hooks/useErrorBar";
import { useEffect } from "react";
import ConfirmDelete from "./ConfirmDelete";
import TaskStatusButton from "./shared/TaskStatusButton";
import { DefaultService } from "../client";
import Code from "./shared/Code";
import useApiKey from "../hooks/useApiKey";

export default function DatasetSettings() {
  const { id } = useParams();
  const { showError } = useErrorBar();
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

  const { data: metadata } = useSWR(
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

  // ------
  // Render
  // ------

  return (
    <Container>
      <Stack spacing={5}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/datasets">
            Datasets
          </Link>
          <Link component={RouterLink} to={`/dataset/${id}`}>
            {metadata?.name}
          </Link>
          <Bold>Settings</Bold>
        </Breadcrumbs>
        <Box>
          <Typography variant="h6">Files</Typography>
          <Box>
            {metadata?.synced_file_dataset_metadata?.map((sfdm) => {
              const sf = sfdm.synced_file;
              if (!sf) return null;
              return (
                <Box display="flex" flexWrap="wrap" key={sfdm.id}>
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
        </Box>
        <Stack>
          <Typography variant="h6">Access from your code</Typography>
          <Code>
            python:
            <br />
            import brainshare as br
            <br />
            ds = br.Dataset("{metadata?.name}")
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
          <Bold>Danger Zone</Bold>
          <Box>
            <ConfirmDelete table="dataset" onConfirm={handleDelete} />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}
