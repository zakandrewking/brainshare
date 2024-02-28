import { get as _get } from "lodash";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import useSWR from "swr";

import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";

import supabase from "../supabase";
import { capitalizeFirstLetter } from "../util/stringUtils";
import LoadingFade from "./shared/LoadingFade";

function boldSubstring(main: string, sub: string): JSX.Element {
  const index = main.toLowerCase().indexOf(sub.toLowerCase());
  if (index === -1) {
    return <>{main}</>;
  }
  return (
    <>
      {main.slice(0, index)}
      <Typography component="span" sx={{ fontWeight: "bold" }}>
        {main.slice(index, index + sub.length)}
      </Typography>
      {main.slice(index + sub.length, main.length)}
    </>
  );
}

export default function SearchGraph() {
  const [searchParams, _] = useSearchParams();
  const query = searchParams.get("q");

  const {
    data: results,
    error,
    isLoading,
  } = useSWR(
    query ? `/search/q=${query}` : null,
    async () => {
      const { data, error } = await supabase.rpc("search_graph", {
        query: query || "",
      });
      if (error) throw Error(String(error));
      return _get(data, ["results"], null);
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  if (error) {
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <Container>
      {/* Spinner */}
      <LoadingFade isLoading={isLoading} />
      {!isLoading && (
        <List>
          {results
            ? results.map((result: any) => {
                const match: string | undefined = result?.match;
                const node_type_id: string = result?.node_type_id ?? "";
                const id: string = result?.id ?? "";
                const score: number = result?.score ?? 0;
                return (
                  <ListItem
                    sx={{ height: "80px", display: "flex", overflow: "hidden" }}
                  >
                    <ListItemButton
                      component={RouterLink}
                      to={`/node/${node_type_id}/${id}`}
                      sx={{ display: "block" }}
                    >
                      <Typography
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {capitalizeFirstLetter(node_type_id)}
                        {": "}
                        {_get(result, "name", "")}{" "}
                        <Box component="span" sx={{ opacity: 0.3 }}>
                          ({score.toFixed(2)})
                        </Box>
                      </Typography>
                      <Typography
                        sx={{
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {query && match ? (
                          boldSubstring(match, query)
                        ) : (
                          <>&nbsp;</>
                        )}
                      </Typography>
                    </ListItemButton>
                  </ListItem>
                );
              })
            : "No results"}
        </List>
      )}
    </Container>
  );
}
