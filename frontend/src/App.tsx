import { Error404 } from "./components/errors";
import { get as _get } from "lodash";
import { getDesignTokens } from "./theme";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useDisplayConfig, AuthProvider } from "./supabaseClient";
import { useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";

import ApiDocs from "./components/ApiDocs";
import Credits from "./components/Credits";
import Docs from "./components/Docs";
import ensureBasename from "./util/ensureBasename";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import LogOut from "./components/LogOut";
import PageLayout from "./components/PageLayout";
import Resource from "./components/Resource";
import ResourceList from "./components/ResourceList";
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

  const displayConfig = useDisplayConfig();
  const plural = _get(displayConfig, ["plural"], {});
  const configRoutes = _get(displayConfig, ["topLevelResources"], []).flatMap(
    (x: string) => [
      {
        path: `/${x}`,
        element: <ResourceList table={x} tablePlural={_get(plural, x, x)} />,
      },
      { path: `/${x}/new`, element: <Resource table={x} edit={true} /> },
      { path: `/${x}/:id`, element: <Resource table={x} /> },
      { path: `/${x}/:id/edit`, element: <Resource table={x} edit={true} /> },
    ]
  );

  const router = createBrowserRouter(
    [
      {
        element: <ReactRouterRoot />,
        children: [
          { path: "/api-docs", element: <ApiDocs /> },
          {
            element: (
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <PageLayout />
              </ThemeProvider>
            ),
            children: [
              { path: "/", element: <Home /> },
              ...configRoutes,
              { path: "/docs", element: <Docs /> },
              {
                path: "/search",
                element: <Search key={Date.now()} />,
              },
              { path: "/credits", element: <Credits /> },
              {
                path: "/log-in",
                element: <LogIn darkMode={prefersDarkMode} />,
              },
              {
                path: "/log-out",
                element: <LogOut />,
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
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
