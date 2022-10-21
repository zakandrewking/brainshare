/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import { Database } from "../database.types";
import { Link as RouterLink } from "react-router-dom";
import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";

type Chemical = Database["public"]["Tables"]["chemical"]["Row"];

interface SearchReturn {
  data: { results: Chemical[] } | null;
  error: PostgrestError | null;
}

export default function Search() {
  const [searchParams, _] = useSearchParams();
  const [results, setResults] = useState<Chemical[]>([]);
  const query = searchParams.get("q") || "";
  useEffect(() => {
    const search = async () => {
      const { data, error } = (await supabase.rpc("search", {
        query,
      })) as SearchReturn;
      if (error) throw Error(String(error));
      if (data) setResults(data.results);
    };
    search();
  }, [query]);
  return (
    <List>
      {results.map((result) => {
        return (
          <ListItem
            sx={{ height: "50px", display: "flex", overflow: "hidden" }}
          >
            <ListItemButton
              component={RouterLink}
              to={`/chemicals/${result.id}`}
              // sx={{ height: "50px", display: "flex", overflow: "hidden" }}
            >
              <ListItemText
                sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {result.name}
              </ListItemText>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
