import React from "react";
import { Link as RouterLink } from "react-router-dom";
import supabase, { useDisplayConfig, useStructureUrl } from "../supabaseClient";
import useMediaQuery from "@mui/material/useMediaQuery";
import useSWRInfinite from "swr/infinite";
import { get as _get, isString as _isString } from "lodash";

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
import { capitalizeFirstLetter } from "../util/stringUtils";
import { width } from "@mui/system";

const ROWS_TO_START = 20;
const MAX_ROWS = 1000;

function Thumbnail({ data, options }: { data: any; options: any }) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    data,
    options.bucket,
    options.pathTemplate,
    prefersDarkMode
  );
  return (
    <TableCell component="div">
      <div
        style={{
          height: "50px",
          overflow: "hidden",
        }}
      >
        {svgUrl && <img alt="structure" src={svgUrl} />}
      </div>
    </TableCell>
  );
}

function TextCell({ name }: { name: string }) {
  return (
    <TableCell component="div">
      <Typography
        sx={{
          wordBreak: "break-all",
          overflow: "hidden",
        }}
      >
        {name}
      </Typography>
    </TableCell>
  );
}

export default function ResourceList({
  table,
  tablePlural,
}: {
  table: string;
  tablePlural: string;
}) {
  const fetcher = async ({ more }: { more: boolean }) => {
    const start = more ? ROWS_TO_START : 0;
    const end = (more ? MAX_ROWS : ROWS_TO_START) - 1;
    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from(table)
      .select("id,name", more ? {} : { count: "exact" })
      .range(start, end);
    if (error) throw Error(String(error));
    return { rows, count };
  };
  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    (i) => {
      return { url: `/${table}`, more: i !== 0 };
    },
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const rows = data ? data.flatMap((ar) => ar.rows) : null;
  const count = data && data[0] && data[0].count ? data[0].count : 0;

  const displayConfig = useDisplayConfig();
  const listProperties = _get(displayConfig, ["listProperties", table], {});

  // const [rowsState, setRowsState] = useState<any[]>([]);
  // const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  // useEffect(() => {
  //   setRowsState(rows ? rows.map((x) => x.id) : []);
  //   // only set this once! It's needed for useStructureUrls
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);
  // const { structureUrls } = useStructureUrls(rowsState, prefersDarkMode);

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  // handle loading state
  const displayRows =
    rows || Array.from({ length: ROWS_TO_START }).map((_, i) => ({ id: i }));

  const getFooter = () => {
    const didLoadFirst = data && data.length === 1 && !isValidating;
    const hasMore = data && data.length < count;
    const isLoadingSecond = data && data.length === 1 && isValidating;
    const didLoadSecond = data && data.length === 2;
    const tooMany = count > MAX_ROWS;
    if (didLoadFirst && !didLoadSecond && hasMore) {
      return (
        <React.Fragment>
          {`Showing first ${displayRows.length} of ${count} ${tablePlural}`}
          <Button onClick={() => setSize(size + 1)}>Load more</Button>
        </React.Fragment>
      );
    } else if (didLoadFirst && !didLoadSecond) {
      return `Showing ${displayRows.length} of ${count} ${tablePlural}`;
    } else if (isLoadingSecond) {
      return <CircularProgress size={20} />;
    } else if (didLoadSecond && tooMany) {
      return `Showing first ${displayRows.length} of ${count} ${tablePlural}`;
    } else if (didLoadSecond) {
      return `Showing ${displayRows.length} of ${count} ${tablePlural}`;
    }
  };

  return (
    <TableContainer>
      <Table component="div">
        <TableHead component="div">
          <TableRow component="div">
            {listProperties.map((column: any, i: number) => {
              const width = _get(column, ["width"]);
              const columnName = _isString(column)
                ? column
                : _get(column, ["name"], "");
              return (
                <TableCell
                  component="div"
                  sx={{
                    ...(width ? { width: `${width}px` } : {}),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography>{capitalizeFirstLetter(columnName)}</Typography>
                    {i === displayRows.length && (
                      <Button component={RouterLink} to="new">
                        Add {table}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody component="div">
          {displayRows.map((row: any) => (
            <TableRow
              key={row.id}
              component={RouterLink}
              to={`${row.id}`}
              hover
              sx={{ textDecoration: "none" }}
            >
              {listProperties.map((column: any) =>
                _get(column, ["type"]) === "thumbnail" ? (
                  <Thumbnail data={row} options={column} />
                ) : (
                  <TextCell name={_get(row, [column], "")} />
                )
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter
          component="div"
          sx={{
            display: "table-caption",
            captionSide: "bottom",
            border: "none",
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-evenly"
            height="100px"
            alignItems="center"
          >
            {getFooter()}
          </Box>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
