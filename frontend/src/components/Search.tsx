/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import { Database } from "../database.types";
import { Link as RouterLink } from "react-router-dom";
import { PostgrestError } from "@supabase/supabase-js";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import useSWR from "swr";

import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";

type Chemical = Database["public"]["Tables"]["chemical"]["Row"];

interface ChemicalWithScore extends Chemical {
  score: number;
}

interface SearchReturn {
  data: { results: ChemicalWithScore[] } | null;
  error: PostgrestError | null;
}

export default function Search() {
  const [searchParams, _] = useSearchParams();
  const query = searchParams.get("q") || "";

  const fetcher = async () => {
    const { data, error } = (await supabase.rpc("search", {
      query,
    })) as SearchReturn;
    if (error) throw Error(String(error));
    return data?.results ?? null;
  };

  const {
    data: results,
    error,
    isValidating,
  } = useSWR(`/search/q=${query}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  // handle loading state
  const displayResults = isValidating
    ? Array.from({ length: 10 }).map((_, i) => ({ id: i, name: "", score: "" }))
    : results;

  return (
    <List>
      {displayResults
        ? displayResults.map((result) => {
            return (
              <ListItem
                sx={{ height: "50px", display: "flex", overflow: "hidden" }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={`/chemicals/${result.id}`}
                >
                  <ListItemText
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {result.name} {result.score && `(${result.score})`}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            );
          })
        : "No results"}
    </List>
  );
}
