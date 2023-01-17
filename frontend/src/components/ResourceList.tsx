import React from "react";
import { Link as RouterLink } from "react-router-dom";
import useSWRInfinite from "swr/infinite";
import { get as _get } from "lodash";

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

import supabase, { useDisplayConfig } from "../supabaseClient";
import { capitalizeFirstLetter, getProp } from "../util/stringUtils";
import { Svg, Text } from "./propertyComponents";

const PAGE_SIZE = 20;

export default function ResourceList({
  table,
  tablePlural,
}: {
  table: string;
  tablePlural: string;
}) {
  // Read the display configuration
  const displayConfig = useDisplayConfig();
  const listProperties = _get(displayConfig, ["listProperties", table], {});
  const specialCapitalize = _get(displayConfig, ["specialCapitalize"], {});
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});

  // Get the list of properties that we need to query. Don't query for the SVG
  // because it's in object storage.
  const selectString =
    "id," +
    listProperties
      .map((x: any) => getProp(x, table))
      .filter((x: any) => _get(propertyTypes, [x, "type"]) !== "svg")
      .join(",");

  // Fetch data
  const fetcher = async ({ page, limit }: { page: number; limit: number }) => {
    const start = page * limit;
    const end = (page + 1) * limit - 1;
    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from(table)
      .select(selectString, page === 0 ? { count: "exact" } : {})
      .range(start, end);
    if (error) throw Error(String(error));
    return { rows, ...(page === 0 ? { count } : {}) };
  };

  const getKey = (page: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.rows.length) return null; // reached the end
    return { url: `/${table}`, page, limit: PAGE_SIZE }; // SWR key
  };

  const { data, error, isValidating, size, setSize } = useSWRInfinite(
    getKey,
    fetcher,
    {
      // NOTE: these can change pagination & scroll restoration behavior
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  console.log("size", size);

  const rows = data ? data.flatMap((ar) => ar.rows) : null;
  const count = data && data[0] && data[0].count ? data[0].count : 0;

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  // handle loading state
  const displayRows =
    rows || Array.from({ length: PAGE_SIZE }).map((_, i) => ({ id: i }));

  const getFooter = () => {
    const loadedAll = rows && rows.length >= count;
    return isValidating ? (
      <CircularProgress size={20} />
    ) : loadedAll ? (
      `Showing ${displayRows.length.toLocaleString()} of ${count.toLocaleString()} ${tablePlural}`
    ) : (
      <>
        {`Showing first ${displayRows.length.toLocaleString()} of ${count.toLocaleString()} ${tablePlural}`}
        <Button onClick={() => setSize(size + 1)}>Load more</Button>
      </>
    );
  };

  return (
    <TableContainer>
      <Table component="div">
        <TableHead component="div">
          <TableRow component="div">
            {listProperties.map((entry: any, i: number) => {
              const width = _get(entry, ["width"]);
              const prop = getProp(entry, table);
              const displayName = _get(
                entry,
                ["displayName"],
                _get(specialCapitalize, [prop], capitalizeFirstLetter(prop))
              );
              return (
                <TableCell
                  key={prop}
                  component="div"
                  sx={{
                    padding: "0 0 0 30px",
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
                    <Typography>{displayName}</Typography>
                    {i === listProperties.length - 1 && (
                      <Button component={RouterLink} to="new" disabled>
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
          {displayRows.map((data: any) => (
            <TableRow
              key={data.id}
              component={RouterLink}
              to={rows ? `${data.id}` : ""}
              hover
              sx={{ textDecoration: "none", height: "90px" }}
            >
              {listProperties.map((entry: any) => {
                const prop = getProp(entry, table);
                const propData = _get(data, [prop], "");
                const type = _get(propertyTypes, [prop, "type"]);
                const bucket = _get(propertyTypes, [prop, "bucket"]);
                const pathTemplate = _get(propertyTypes, [
                  prop,
                  "pathTemplate",
                ]);
                return (
                  <TableCell
                    component="div"
                    key={prop}
                    sx={{ padding: "0 0 0 30px" }}
                  >
                    {type === "svg" ? (
                      <Svg
                        object={data}
                        bucket={bucket}
                        pathTemplate={pathTemplate}
                        height={85}
                        maxWidth={150}
                      />
                    ) : (
                      <Text data={propData} selectable={false} />
                    )}
                  </TableCell>
                );
              })}
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
