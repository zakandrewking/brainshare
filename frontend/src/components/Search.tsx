/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import supabase from "../supabaseClient";
import { capitalizeFirstLetter } from "../util/stringUtils";

import { get as _get } from "lodash";
import { Link as RouterLink } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import useSWR from "swr";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Fade from "@mui/material/Fade";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import { Typography } from "@mui/material";
import { Fragment } from "react";

function boldSubstring(main: string, sub: string): JSX.Element {
  const index = main.toLowerCase().indexOf(sub.toLowerCase());
  if (index === -1) {
    return <Fragment>{main}</Fragment>;
  }
  return (
    <Fragment>
      {main.slice(0, index)}
      <Typography component="span" sx={{ fontWeight: "bold" }}>
        {main.slice(index, index + sub.length)}
      </Typography>
      {main.slice(index + sub.length, main.length)}
    </Fragment>
  );
}

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
      // revalidateIfStale: false,
      // revalidateOnFocus: false,
      // revalidateOnReconnect: false,
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
            const match = _get(result, "match");
            return (
              <ListItem
                sx={{ height: "80px", display: "flex", overflow: "hidden" }}
              >
                <ListItemButton
                  component={RouterLink}
                  to={`/${resource}/${_get(result, "id", "")}`}
                  sx={{ display: "block" }}
                >
                  <Typography
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {capitalizeFirstLetter(resource)}
                    {": "}
                    {_get(result, "name", "")}{" "}
                    {`(${parseFloat(_get(result, "score", "")).toFixed(1)})`}
                  </Typography>
                  <Typography
                    sx={{
                      fontStyle: "italic",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {match ? (
                      boldSubstring(match, query)
                    ) : (
                      <Fragment>&nbsp;</Fragment>
                    )}
                  </Typography>
                </ListItemButton>
              </ListItem>
            );
          })
        : "No results"}
    </List>
  );
}
