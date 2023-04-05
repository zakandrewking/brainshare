import { useContext } from "react";
import {
  Link as RouterLink,
  matchPath,
  Outlet,
  useLocation,
} from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { DocStoreContext } from "../stores/DocStore";

function useRouteMatch(patterns: readonly string[]) {
  const { pathname } = useLocation();

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    const possibleMatch = matchPath(pattern, pathname);
    if (possibleMatch !== null) {
      return possibleMatch;
    }
  }

  return null;
}

export default function DocTabs() {
  const routeMatch = useRouteMatch(["/doc", "/doc/annotate", "/doc/chat"]);
  const { state } = useContext(DocStoreContext);
  const currentTab = routeMatch?.pattern?.path;

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Tabs value={currentTab} variant="fullWidth">
          <Tab
            label="File"
            value="/doc"
            to="/doc"
            component={RouterLink}
            replace
          />
          <Tab
            disabled={!state.annotateStep?.ready}
            label="Annotate"
            value="/doc/annotate"
            to="/doc/annotate"
            component={RouterLink}
            replace
          />
          <Tab
            disabled={!state.chatStep?.ready}
            label="Chat"
            value="/doc/chat"
            to="/doc/chat"
            component={RouterLink}
            replace
          />
        </Tabs>
      </AppBar>
      <Outlet />
    </>
  );
}
