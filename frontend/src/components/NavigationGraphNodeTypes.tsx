// TODO drop lodash
import { get as _get } from "lodash";
import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import useSWRImmutable from "swr/immutable";

import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import supabase from "../supabase";
import icons from "./icons";
import { capitalizeFirstLetter } from "../util/stringUtils";
import pluralize from "pluralize";

export default function NavigationGraphNodeTypes() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const { data: nodeTypes } = useSWRImmutable("/node_type", async () => {
    const { data, error } = await supabase.from("node_type").select("*");
    if (error) throw Error(error.message);
    return data;
  });
  const topLevelNodeTypes = nodeTypes?.filter((n) => n.top_level);

  return (
    <>
      <Divider />
      <ListItemButton
        onClick={(event) => {
          event.stopPropagation();
          setOpen(!open);
        }}
      >
        <ListItemText
          primary={"PUBLIC GRAPH"}
          primaryTypographyProps={{ fontSize: "13px", fontWeight: 600 }}
        />
        {open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {topLevelNodeTypes &&
          topLevelNodeTypes.map((nodeType) => (
            <ListItem key={nodeType.id} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={`/node/${nodeType.id}`}
                selected={Boolean(
                  pathname.match(new RegExp(`/node/${nodeType.id}`))
                )}
              >
                <ListItemIcon>
                  {_get(icons, [nodeType.icon ?? ""], "default")}
                </ListItemIcon>
                <ListItemText
                  primary={capitalizeFirstLetter(pluralize(nodeType.id))}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </Collapse>
    </>
  );
}
