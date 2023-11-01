import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import { Box, Button, Container, Stack, Typography } from "@mui/material";

import supabase, { useAuth } from "../supabase";

export default function MyGraphList() {
  const { session } = useAuth();

  const { data, mutate } = useSWR(
    "/file",
    async () => {
      const { data: rows, error } = await supabase.from("graph").select("*");
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

  const createGraph = async () => {
    const { data: newGraph, error } = await supabase
      .from("graph")
      .insert([{ name: "New Graph", user_id: session!.user.id }])
      .select("*")
      .single();
    if (error) throw Error(error.message);
    mutate(
      { rows: rows ? [newGraph, ...rows] : [newGraph] },
      { revalidate: false }
    );
  };

  const deleteGraph = async (id: string) => {
    const { error } = await supabase.from("graph").delete().match({ id });
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
        <Typography variant="h4">My Graphs</Typography>
        {session ? (
          <>
            <Button variant="outlined" onClick={createGraph}>
              New Graph
            </Button>
            {rows?.map((row: any) => (
              <Box key={row.id}>
                <Button component={RouterLink} to={`/graph/${row.id}`}>
                  {row.name}
                </Button>
                <Button onClick={() => deleteGraph(row.id)}>Delete</Button>
              </Box>
            ))}
          </>
        ) : (
          <Box sx={{ marginTop: "30px" }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/file"
            >
              Log in
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
