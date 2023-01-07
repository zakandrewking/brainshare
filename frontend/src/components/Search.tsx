/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import { capitalizeFirstLetter } from "../util/stringUtils";
import { get as _get } from "lodash";
import { Link as RouterLink } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import useSWR from "swr";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

export default function Search() {
  const [searchParams, _] = useSearchParams();
  const query = searchParams.get("q") || "";

  const {
    data: results,
    error,
    isValidating,
  } = useSWR(
    `/search/q=${query}`,
    async () => {
      const { data, error } = await supabase.rpc("search", {
        query,
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
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  return isValidating ? (
    <Box display="flex" justifyContent="center">
      <Fade
        in={isValidating}
        style={{
          transitionDelay: isValidating ? "800ms" : "0ms",
        }}
        unmountOnExit
      >
        <CircularProgress />
      </Fade>
    </Box>
  ) : (
    <List>
      {results
        ? results.map((result: any) => {
            const resource = _get(result, "resource", "");
            return (
              <ListItem
                sx={{ height: "50px", display: "flex", overflow: "hidden" }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={`/${resource}/${_get(result, "id", "")}`}
                >
                  <ListItemText
                    sx={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {capitalizeFirstLetter(resource)}
                    {": "}
                    {_get(result, "name", "")}{" "}
                    {`(${_get(result, "score", "")})`}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            );
          })
        : "No results"}
    </List>
  );
}
