import { get as _get } from "lodash";
import { createTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMemo } from "react";
import { SWRConfig } from "swr";

import basename from "./basename";
import Account from "./components/Account";
import ApiDocs from "./components/ApiDocs";
import Credits from "./components/Credits";
import { Error404 } from "./components/errors";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import LogOut from "./components/LogOut";
import PageLayout from "./components/PageLayout";
import Resource from "./components/Resource";
import ResourceList from "./components/ResourceList";
import Search from "./components/Search";
import { useDisplayConfig, AuthProvider } from "./supabase";
import { getDesignTokens } from "./theme";
import ensureBasename from "./util/ensureBasename";

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";

// for debug deployments, redirect localhost to /metabolism
if (process.env.NODE_ENV === "development") {
  ensureBasename();
}

const swrConfig = {
  onError: (error: any) => {
    console.error(error);
  },
};

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? "dark" : "light")),
    [prefersDarkMode]
  );

  const displayConfig = useDisplayConfig();
  const plural = _get(displayConfig, ["plural"], {});
  const configRoutes = _get(displayConfig, ["topLevelResources"], []).flatMap(
    (entry: any) => {
      const name = _get(entry, ["name"], entry);
      return [
        {
          path: `/${name}`,
          element: (
            <ResourceList table={name} tablePlural={_get(plural, name, name)} />
          ),
        },
        {
          path: `/${name}/new`,
          element: <Resource table={name} edit={true} />,
        },
        { path: `/${name}/:id`, element: <Resource table={name} /> },
        {
          path: `/${name}/:id/edit`,
          element: <Resource table={name} edit={true} />,
        },
      ];
    }
  );

  const router = createBrowserRouter(
    [
      {
        element: (
          <>
            <Outlet />
            <ScrollRestoration />
          </>
        ),
        children: [
          {
            element: <PageLayout theme={theme} />,
            children: [
              { path: "/", element: <Home /> },
              ...configRoutes,
              { path: "/api-docs", element: <ApiDocs /> },
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
              {
                path: "/account",
                element: <Account />,
              },
            ],
          },
          { path: "/*", element: <Error404 /> },
        ],
      },
    ],
    {
      basename,
    }
  );

  return (
    <AuthProvider>
      <SWRConfig value={swrConfig}>
        <RouterProvider router={router} />
      </SWRConfig>
    </AuthProvider>
  );
}
