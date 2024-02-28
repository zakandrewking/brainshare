import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import {
  Box,
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import supabase, { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";

export default function DatasetList() {
  const { session } = useAuth();

  const { data, isLoading } = useSWR(
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

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

  if (!session) {
    return (
      <Container>
        <Typography variant="h4">Datasets</Typography>
        <Button
          sx={{ marginTop: "30px" }}
          variant="outlined"
          component={RouterLink}
          to="/log-in?redirect=/datasets"
        >
          Log in
        </Button>
      </Container>
    );
  }

  // ------
  // Render
  // ------

  return (
    // TODO LEFT OFF visualize as list with the source file info
    <Container>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Datasets
      </Typography>
      <TableContainer sx={{ marginTop: "5px" }}>
        <Table component="div">
          <TableHead component="div">
            <TableRow component="div"></TableRow>
          </TableHead>
          <TableBody component="div">
            <Stack spacing={4}>
              {(data?.length || 0) > 0 ? (
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
                <Box>No datasets</Box>
              )}
            </Stack>
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
      </TableContainer>

      {/* Spinner */}
      <LoadingFade isLoading={isLoading} />
    </Container>
  );
}
