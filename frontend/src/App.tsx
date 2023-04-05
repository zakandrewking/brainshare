import { useMemo } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";
import { SWRConfig } from "swr";

import { createTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import basename from "./basename";
import { OpenAPI } from "./client";
import Account from "./components/Account";
import Annotate from "./components/Annotate";
import ApiDocs from "./components/ApiDocs";
import Chat from "./components/Chat";
import Credits from "./components/Credits";
import DocTabs from "./components/DocTabs";
import { Error404 } from "./components/errors";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import LogOut from "./components/LogOut";
import PageLayout from "./components/PageLayout";
import Resource from "./components/Resource";
import ResourceList from "./components/ResourceList";
import Search from "./components/Search";
import UploadDoc from "./components/UploadDoc";
import displayConfig from "./displayConfig";
import { DocStoreProvider } from "./stores/DocStore";
import { AuthProvider } from "./supabase";
import { getDesignTokens } from "./theme";
import ensureBasename from "./util/ensureBasename";

// for debug deployments, redirect localhost to /metabolism
if (process.env.NODE_ENV === "development") {
  ensureBasename();
}

const swrConfig = {
  onError: (error: any) => {
    console.error(error);
  },
};

// backend config
if (process.env.REACT_APP_BACKEND_URL === undefined) {
  console.error("Missing REACT_APP_BACKEND_URL");
} else {
  OpenAPI.BASE = process.env.REACT_APP_BACKEND_URL;
}

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? "dark" : "light")),
    [prefersDarkMode]
  );

  const configRoutes = displayConfig.topLevelResources.flatMap((name) => {
    return [
      {
        path: `/${name}`,
        element: <ResourceList table={name} />,
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
  });

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
              {
                path: "/doc",
                element: <DocTabs />,
                children: [
                  { path: "/doc", element: <UploadDoc /> },
                  { path: "/doc/annotate", element: <Annotate /> },
                  { path: "/doc/chat", element: <Chat /> },
                ],
              },
              { path: "/*", element: <Error404 /> },
            ],
          },
        ],
      },
    ],
    {
      basename,
    }
  );

  return (
    <AuthProvider>
      <DocStoreProvider>
        <SWRConfig value={swrConfig}>
          <RouterProvider router={router} />
        </SWRConfig>
      </DocStoreProvider>
    </AuthProvider>
  );
}
