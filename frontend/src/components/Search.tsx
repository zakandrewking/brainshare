/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import { Link as RouterLink } from "react-router-dom";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";

export default function Search() {
  const [searchParams, _] = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const query = searchParams.get("q") || "";
  useEffect(() => {
    const call = async () => {
      const { data, error } = await supabase.rpc("hello_world", { query });
      if (error) throw Error(String(error));
      setResults(data);
    };
    call();
  }, [query]);
  return (
    <List>
      {results &&
        results.map((result) => (
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
        ))}
    </List>
  );
}
