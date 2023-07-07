/**
 * TODO allow search to run again even if the result does not change
 * TODO keep the serach bar wide even if q is empty
 * TODO search button should be clickable unless totally collapsed or empty
 */

import { get as _get } from "lodash";
import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import useSWR from "swr";

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Fade from "@mui/material/Fade";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";

import displayConfig from "../displayConfig";
import supabase from "../supabase";
import { capitalizeFirstLetter } from "../util/stringUtils";

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

function ResourceFilter({
  resource,
  setResource,
}: {
  resource: string;
  setResource: (resource: string) => void;
}) {
  // const [searchParams, setSearchParams] = useSearchParams();

  // TODO get filter from searchParams

  // TODO set filter in searchParams
  // useEffect(() => {
  //   setSearchParams({ q: searchParams.get("q"), resource });
  // }, [resource]);

  const resources = ["all"].concat(displayConfig.topLevelResources);

  return (
    <FormControl fullWidth>
      <InputLabel id="select-resource-filter">Filter by Resource</InputLabel>
      <Select
        labelId="select-resource-filter"
        value={resource}
        label="Filter by Resource"
        onChange={(event) => {
          setResource(event.target.value);
        }}
      >
        {resources.map((resource) => (
          <MenuItem value={resource}>
            {capitalizeFirstLetter(resource)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function Search() {
  const [searchParams, _] = useSearchParams();
  const query = searchParams.get("q");
  const [resource, setResource] = useState<string>("all");

  const {
    data: results,
    error,
    isValidating,
  } = useSWR(
    query ? `/search/q=${query}&r=${resource}` : null,
    async () => {
      const { data, error } = await supabase.rpc("search", {
        query: query || "",
        resource_filter: resource === "all" ? undefined : resource,
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
      <ResourceFilter resource={resource} setResource={setResource} />
      {isValidating ? (
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
                        <Box
                          component="span"
                          sx={{ opacity: 0.3 }}
                        >{`(${parseFloat(_get(result, "score", "")).toFixed(
                          2
                        )})`}</Box>
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
                          <Fragment>&nbsp;</Fragment>
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
