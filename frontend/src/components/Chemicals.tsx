import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 100];

function getRange(page: number, rowsPerPage: number): [number, number] {
  const start = page * rowsPerPage;
  return [start, start + rowsPerPage - 1];
}

export default function Chemicals() {
  const [rows, setData] = useState<any>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<String>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);

  useEffect(() => {
    const getChemicals = async () => {
      const { count, data, error } = await supabase
        .from("chemical")
        .select("name", { count: "exact" }) // TODO don't get the count every time, and make sure it's fast
        .range(...getRange(page, rowsPerPage));
      setCount(count || 0);
      setData(data);
      setError((error || "").toString());
    };
    getChemicals();
  }, [count, page, rowsPerPage]);

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
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
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            count={count}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          ></TablePagination>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
