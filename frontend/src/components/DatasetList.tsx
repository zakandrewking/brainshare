import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import { Box, Button, Container, Stack, Typography } from "@mui/material";

import supabase, { useAuth } from "../supabase";

export default function DatasetList() {
  const { session } = useAuth();

  const { data, mutate } = useSWR(
    "/my-datasets",
    async () => {
      const { data: rows, error } = await supabase.from("dataset").select("*");
      if (error) throw Error(String(error));
      return { rows };
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const rows = data?.rows;

  const createDataset = async () => {
    const { data: newDataset, error } = await supabase
      .from("dataset")
      .insert([{ name: "New Dataset", user_id: session!.user.id }])
      .select("*")
      .single();
    if (error) throw Error(error.message);
    mutate(
      { rows: rows ? [newDataset, ...rows] : [newDataset] },
      { revalidate: false }
    );
  };

  const deleteDataset = async (id: string) => {
    const { error } = await supabase.from("dataset").delete().match({ id });
    if (error) throw Error(error.message);
    if (!rows) throw Error("rows is undefined");
    mutate(
      { rows: rows?.filter((row: any) => row.id !== id) },
      { revalidate: false }
    );
  };

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h4">Datasets</Typography>
        {session ? (
          <Box>
            <Button variant="outlined" component={RouterLink} to="/files">
              Sync a file to create your first dataset
            </Button>
          </Box>
        ) : (
          <Box sx={{ marginTop: "30px" }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/datasets"
            >
              Log in
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
