import { Link as RouterLink } from "react-router-dom";
import useSWR from "swr";

import {
  Button,
  Container,
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
        .select("*, synced_file_dataset_metadata(*, synced_file(*))");
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

  if (session === null) {
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
    <Container>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Datasets
      </Typography>

      <TableContainer>
        {/* we use divs so that the table can contain links as rows */}
        <Table component="div">
          <TableHead component="div">
            <TableRow component="div">
              <TableCell component="div">Dataset</TableCell>
              <TableCell component="div">Synced File(s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody component="div">
            {(data?.length ?? 0) === 0 && (
              <TableRow component="div">
                <TableCell component="div">
                  <Typography>No datasets found.</Typography>
                </TableCell>
                <TableCell component="div" />
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
                <TableCell component="div">{row.table_name}</TableCell>
                <TableCell component="div">
                  {row.synced_file_dataset_metadata?.map(
                    (sfdm) => sfdm?.synced_file?.name
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Spinner */}
      <LoadingFade isLoading={isLoading} />
    </Container>
  );
}
