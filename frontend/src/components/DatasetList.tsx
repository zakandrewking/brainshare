import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import { Box, Button, Container, Stack, Typography } from "@mui/material";

import supabase, { useAuth } from "../supabase";

export default function DatasetList() {
  const { session } = useAuth();

  const { data } = useSWR(
    "/datasets",
    async () => {
      const { data: rows, error } = await supabase
        .from("dataset_metadata")
        .select("*")
        .is("deleted_at", null);
      if (error) throw Error(String(error));
      return rows;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h4">Datasets</Typography>
        {session ? (
          (data?.length || 0) > 0 ? (
            data?.map((row) => (
              <Box key={row.id}>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to={`/dataset/${row.id}`}
                >
                  {row.name}
                </Button>
              </Box>
            ))
          ) : (
            <Box>
              <Button variant="outlined" component={RouterLink} to="/files">
                Sync a file to create your first dataset
              </Button>
            </Box>
          )
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
