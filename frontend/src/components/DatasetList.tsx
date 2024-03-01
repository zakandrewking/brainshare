import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import {
  Box,
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
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
        .select("*, synced_file_dataset_metadata(*, synced_file(*))")
        .is("deleted_at", null);
      if (error) throw Error(String(error));
      return rows;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dataset</TableCell>
              <TableCell>Synced File(s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography>No datasets found.</Typography>
                </TableCell>
              </TableRow>
            )}
            {data?.map((row) => (
              <TableRow
                key={row.id}
                hover
                component={RouterLink}
                to={`/dataset/${row.id}`}
                sx={{ textDecoration: "none" }}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  {row.synced_file_dataset_metadata?.map(
                    (sfdm) => sfdm?.synced_file?.name
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter></TableFooter>
        </Table>
      </TableContainer>

      {/* Spinner */}
      <LoadingFade isLoading={isLoading} />
    </Container>
  );
}
