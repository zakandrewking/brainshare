import { Link as RouterLink } from "react-router-dom";
import supabase, { useStructureUrls } from "../supabaseClient";
import useMediaQuery from "@mui/material/useMediaQuery";
import useSWRInfinite from "swr/infinite";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

const ROWS_TO_START = 20;
const MAX_ROWS = 1000;

export default function Chemicals() {
  const fetcher = async ({ more }: { more: boolean }) => {
    const start = more ? ROWS_TO_START : 0;
    const end = (more ? MAX_ROWS : ROWS_TO_START) - 1;
    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from("chemical")
      .select("id,name", more ? {} : { count: "exact" })
      .range(start, end);
    // if (count) setCount(count);
    if (error) throw Error(String(error));
    return { rows, count };
  };
  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    (i) => {
      return { url: "/chemicals", more: i !== 0 };
    },
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // handle loading
  const rows = data
    ? data.flatMap((ar) => ar.rows)
    : Array.from({ length: ROWS_TO_START }).map((_, i) => ({ id: i }));
  const count = data && data[0] && data[0].count ? data[0].count : 0;

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { structureUrls } = useStructureUrls(
    error ? [] : rows.map((x) => x.id),
    prefersDarkMode
  );

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  const getFooter = () => {
    const didLoadFirst = data && data.length === 1 && !isValidating;
    const isLoadingSecond = data && data.length === 1 && isValidating;
    const didLoadSecond = data && data.length === 2;
    const tooMany = count > MAX_ROWS;
    if (didLoadFirst && !didLoadSecond) {
      return <Button onClick={() => setSize(size + 1)}>Load more</Button>;
    } else if (isLoadingSecond) {
      return <CircularProgress size={20} />;
    } else if (didLoadSecond && tooMany) {
      return `Showing first ${rows.length} of ${count} chemicals`;
    } else if (didLoadSecond) {
      return `${rows.length} chemicals`;
    }
  };

  return (
    <TableContainer>
      <Table component="div">
        <TableHead component="div">
          <TableRow component="div">
            <TableCell component="div" sx={{ width: "200px" }}></TableCell>
            <TableCell component="div">Name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody component="div">
          {rows.map((row: any) => (
            <TableRow
              key={row.id}
              component={RouterLink}
              to={`${row.id}`}
              hover
              sx={{ textDecoration: "none" }}
            >
              <TableCell component="div">
                {structureUrls[row.id] && (
                  <img
                    alt="structure"
                    src={structureUrls[row.id]}
                    style={{ height: "100px" }}
                  />
                )}
              </TableCell>
              <TableCell component="div">
                <Typography sx={{ wordBreak: "break-all" }}>
                  {row.name || ""}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter component="div">
          <TableRow component="div" sx={{ height: "80px" }}>
            <TableCell component="div" sx={{ border: "none" }}>
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
