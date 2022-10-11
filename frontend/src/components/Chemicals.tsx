import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Button } from "@mui/material";

const ROWS_TO_START = 20;
const MAX_ROWS = 1000;

enum MoreStatus {
  Start,
  LoadingMore,
  LoadedMore,
}

export default function Chemicals() {
  const [rows, setData] = useState<any>([]);
  const [error, setError] = useState<String>("");
  const [more, setMore] = useState(MoreStatus.Start);
  const [rowsToLoad, setRowsToLoad] = useState(ROWS_TO_START);

  useEffect(() => {
    // TODO only run once!
    const getChemicals = async () => {
      const { data, error } = await supabase
        .from("chemical")
        .select("name")
        .range(0, rowsToLoad - 1);
      setData(data);
      setError((error || "").toString());
      if (!error && more === MoreStatus.LoadingMore)
        setMore(MoreStatus.LoadedMore);
    };
    getChemicals();
  }, [rowsToLoad, more]);

  const loadMore = () => {
    setMore(MoreStatus.LoadedMore);
    setRowsToLoad(MAX_ROWS);
  };

  const getFooter = () => {
    switch (more) {
      case MoreStatus.Start:
        return <Button onClick={loadMore}>Load more</Button>;
      case MoreStatus.LoadingMore:
        return <CircularProgress size={20} />;
      case MoreStatus.LoadedMore:
        return rows.length >= MAX_ROWS
          ? "Too many chemicals to show them all"
          : `${rows.length} chemicals`;
    }
  };

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row: any) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ height: "30px" }}>
            <TableCell sx={{ border: "none" }}>
              <Box display="flex" justifyContent="center" alignItems="center">
                {getFooter()}
              </Box>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
