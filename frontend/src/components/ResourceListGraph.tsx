import { find as _find, get as _get, uniq as _uniq } from "lodash";
import pluralize from "pluralize";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";
import useSWRImmutable from "swr/immutable";
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

import { DefinitionOptionsJson } from "../databaseExtended.types";
import supabase, { useAuth } from "../supabase";
import { roundUp100 } from "../util/numberUtils";
import SvgGraph from "./propertyComponents/SvgGraph";
import TextGraph from "./propertyComponents/TextGraph";

const PAGE_SIZE = 20;

function Footer({
  count,
  displayCount,
  isValidating,
  loadedAll,
  nodeTypeId,
  setSize,
  size,
}: {
  count: number;
  displayCount: number;
  isValidating: boolean;
  loadedAll: boolean;
  nodeTypeId?: string;
  setSize: (size: number) => void;
  size: number;
}): JSX.Element {
  return isValidating ? (
    <CircularProgress size={20} />
  ) : loadedAll ? (
    <>
      {`Showing ${displayCount.toLocaleString()} of ~ ${roundUp100(
        count
      ).toLocaleString()} ${pluralize(nodeTypeId ?? "")}`}
    </>
  ) : (
    <>
      {`Showing first ${displayCount.toLocaleString()} of ~ ${roundUp100(
        count
      ).toLocaleString()} ${pluralize(nodeTypeId ?? "")}`}
      <Button onClick={() => setSize(size + 1)}>Load more</Button>
    </>
  );
}

export default function ResourceListGraph() {
  const { nodeTypeId } = useParams();
  const location = useLocation();
  const { session, role } = useAuth();

  // Get the node type details
  const { data: nodeTypes } = useSWRImmutable("/node_type", async () => {
    const { data, error } = await supabase.from("node_type").select("*");
    if (error) throw Error(error.message);
    return data;
  });
  const nodeType = _find(nodeTypes, { id: nodeTypeId });

  // Get the property definitions
  const { data: definitions } = useSWRImmutable("/definition", async () => {
    const { data, error } = await supabase.from("definition").select("*");
    if (error) throw Error(error.message);
    return data;
  });

  // map the definitions
  const listDefinitions =
    definitions &&
    nodeType?.list_definition_ids
      .map((id) => _find(definitions, { id }))
      .map((definition) => {
        const options = definition?.options;
        return {
          ...definition,
          options: options ? (options as DefinitionOptionsJson) : undefined,
        };
      });

  // Can only fetch if the node type & definitions are loaded
  // TODO make a useDefinitions hook
  const shouldFetch = listDefinitions !== undefined;

  // Get the list of properties that we need to query. Don't query for the SVG
  // because it's in object storage.
  let selectString = "id";
  const dataKeys = _uniq(
    listDefinitions
      ?.map((definition) => definition?.options?.dataKey)
      .filter((dataKey) => dataKey !== undefined)
  );
  if (dataKeys.length > 0) {
    selectString +=
      "," + dataKeys.map((dataKey) => `data->${dataKey}`).join(",");
  }

  const fetcher = async ({ page, limit }: { page: number; limit: number }) => {
    const start = page * limit;
    const end = (page + 1) * limit - 1;
    const { data, error, count } = await supabase
      .from("node")
      .select(selectString, page === 0 ? { count: "estimated" } : {})
      .eq("node_type_id", nodeTypeId!)
      .range(start, end);
    if (error) throw Error(String(error));
    // Cast the types because supabase gets caught by the dynamic select string.
    // We flattened the query, so the data is flat object.
    const rows = data as { [key: string]: any }[];
    return {
      rows,
      ...(page === 0 ? { count } : {}),
    };
  };

  const getKey = (page: number, previousPageData: any) => {
    if (!shouldFetch) return null; // don't fetch until node type is loaded
    if (previousPageData && !previousPageData.rows.length) return null; // reached the end
    return {
      url: `/node?node_type_id=${nodeTypeId}`,
      page,
      limit: PAGE_SIZE,
      locationKey: location.key, // reload if we route there from a separate click
    };
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

  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  // handle loading states
  const rows = data?.flatMap((ar) => ar.rows);
  const count = data?.[0].count ?? 0;
  const loadedAll = (rows?.length ?? 0) >= count;
  const isSkeleton = rows === undefined;
  const displayRows =
    rows ||
    Array.from({ length: PAGE_SIZE }).map(
      (_, i) => ({ id: i } as { [key: string]: any })
    );
  const displayCount = displayRows.length;

  return (
    <TableContainer sx={{ marginTop: "5px" }}>
      <Table component="div">
        <TableHead component="div">
          <TableRow component="div">
            {listDefinitions?.map((definition, i) => {
              const width = definition?.options?.width;
              const displayName = definition?.options?.displayName;
              return (
                <TableCell
                  key={i}
                  component="div"
                  sx={{
                    padding: "0 0 3px 30px",
                    width: width ? `${width}px` : "unset",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography>{displayName ?? ""}</Typography>
                    {i === listDefinitions.length - 1 && (
                      <Button
                        component={RouterLink}
                        to="new"
                        disabled={!(session && role === "admin")}
                      >
                        Add {nodeTypeId}
                      </Button>
                    )}
                  </Box>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody component="div">
          {displayRows.map((row, i) => (
            <TableRow
              key={i}
              component={RouterLink}
              to={rows ? `${row.id}` : ""}
              hover
              sx={{ textDecoration: "none", height: "90px" }}
            >
              {listDefinitions?.map((definition, i) => {
                const componentArguments = {
                  data: row,
                  options: {
                    ...definition?.options,
                    displayName: "",
                  },
                };
                return (
                  <TableCell
                    component="div"
                    key={i}
                    sx={{ padding: "0 0 0 30px" }}
                  >
                    {isSkeleton || !definition ? (
                      <></>
                    ) : definition.component_id === "svg" ? (
                      <SvgGraph {...componentArguments} />
                    ) : (
                      <TextGraph {...componentArguments} />
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
            <Footer
              count={count}
              displayCount={displayCount}
              isValidating={isValidating}
              loadedAll={loadedAll}
              nodeTypeId={nodeTypeId}
              setSize={setSize}
              size={size}
            />
          </Box>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
