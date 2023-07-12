import { get as _get } from "lodash";
import pluralize from "pluralize";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";
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

import displayConfig from "../displayConfig";
import supabase, { useAuth } from "../supabase";
import { roundUp100 } from "../util/numberUtils";
import { capitalizeFirstLetter } from "../util/stringUtils";
import Text from "./propertyComponents/Text";

const PAGE_SIZE = 20;

export default function ResourceListGraph() {
  const listProperties = ["name"];
  const specialCapitalize = displayConfig.specialCapitalize;

  const { nodeType } = useParams();
  const location = useLocation();

  const { session, role } = useAuth();

  const fetcher = async ({ page, limit }: { page: number; limit: number }) => {
    const start = page * limit;
    const end = (page + 1) * limit - 1;
    const {
      data: rows,
      error,
      count,
    } = await supabase
      .from("node")
      .select("id, name: data->name", page === 0 ? { count: "estimated" } : {})
      .eq("type", nodeType)
      .range(start, end);
    if (error) throw Error(String(error));
    return { rows, ...(page === 0 ? { count } : {}) };
  };

  const getKey = (page: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.rows.length) return null; // reached the end
    return {
      url: `/graph/${nodeType}`,
      page,
      limit: PAGE_SIZE,
      locationKey: location.key, // reload if we route there from a separate click
    }; // SWR key
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

  const rows = data ? data.flatMap((ar) => ar.rows) : null;
  const count = data && data[0] && data[0].count ? data[0].count : 0;

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  // handle loading state
  const displayRows =
    rows ||
    Array.from({ length: PAGE_SIZE }).map((_, i) => ({
      id: i,
      skeleton: true,
    }));

  const getFooter = () => {
    const loadedAll = rows && rows.length >= count;
    return isValidating ? (
      <CircularProgress size={20} />
    ) : loadedAll ? (
      `Showing ${displayRows.length.toLocaleString()} of ~ ${roundUp100(
        count
      ).toLocaleString()} ${pluralize(nodeType ?? "")}`
    ) : (
      <>
        {`Showing first ${displayRows.length.toLocaleString()} of ~ ${roundUp100(
          count
        ).toLocaleString()} ${pluralize(nodeType ?? "")}`}
        <Button onClick={() => setSize(size + 1)}>Load more</Button>
      </>
    );
  };

  return (
    <TableContainer sx={{ marginTop: "5px" }}>
      <Table component="div">
        <TableHead component="div">
          <TableRow component="div">
            {listProperties.map((property, i) => {
              const maxWidth = "200px";
              const displayName = _get(
                specialCapitalize,
                [property],
                capitalizeFirstLetter(property)
              );
              return (
                <TableCell
                  key={property}
                  component="div"
                  sx={{
                    padding: "0 0 3px 30px",
                    ...(maxWidth ? { width: `${maxWidth}px` } : {}),
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
                      <Button
                        component={RouterLink}
                        to="new"
                        disabled={!(session && role === "admin")}
                      >
                        Add {nodeType}
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
              {listProperties.map((property) => {
                return (
                  <TableCell
                    component="div"
                    key={property}
                    sx={{ padding: "0 0 0 30px" }}
                  >
                    {data.skeleton ? (
                      <></>
                    ) : (
                      <Text
                        displayName={""}
                        data={data}
                        propertyKey={property}
                      />
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
