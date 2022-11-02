import { Error404 } from "./components/errors";
import { get as _get } from "lodash";
import { getDesignTokens } from "./theme";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useDisplayConfig } from "./supabaseClient";
import { useMemo } from "react";
import Resource from "./components/Resource";
import Chemicals from "./components/Chemicals";
import CssBaseline from "@mui/material/CssBaseline";
import Docs from "./components/Docs";
import ensureBasename from "./util/ensureBasename";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import PageLayout from "./components/PageLayout";
import Search from "./components/Search";
import useMediaQuery from "@mui/material/useMediaQuery";

import {
  createBrowserRouter,
  RouterProvider,
  ScrollRestoration,
  useOutlet,
} from "react-router-dom";

// for debug deployments, redirect localhost to /metabolism
if (process.env.NODE_ENV === "development") {
  ensureBasename();
}

function ReactRouterRoot() {
  const outlet = useOutlet();
  return (
    <div>
      {outlet} <ScrollRestoration />
    </div>
  );
}

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? "dark" : "light")),
    [prefersDarkMode]
  );

  const { displayConfig, error } = useDisplayConfig();
  if (error) console.error(error);
  const configRoutes = _get(displayConfig, ["topLevelResources"], []).flatMap(
    (x: string) => [
      { path: `/${x}`, element: <Chemicals /> },
      { path: `/${x}/:id`, element: <Resource table={x} /> },
    ]
  );

  const router = createBrowserRouter(
    [
      {
        element: <ReactRouterRoot />,
        children: [
          {
            element: <PageLayout />,
            children: [
              { path: "/", element: <Home /> },
              ...configRoutes,
              { path: "/docs", element: <Docs /> },
              {
                path: "/search",
                element: <Search key={Date.now()} />,
              },
              {
                path: "/log-in",
                element: <LogIn darkMode={prefersDarkMode} />,
              },
              { path: "/*", element: <Error404 /> },
            ],
          },
        ],
      },
    ],
    {
      basename: "/metabolism",
    }
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
