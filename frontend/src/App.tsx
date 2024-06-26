import axios from "axios";
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

import { OpenAPI } from "./client";
import Account from "./components/Account";
import Annotate from "./components/Annotate";
import ApiDocs from "./components/ApiDocs";
import Chat from "./components/Chat";
import Credits from "./components/Credits";
import Dataset from "./components/Dataset";
import DatasetList from "./components/DatasetList";
import DatasetSettings from "./components/DatasetSettings";
import DocTabs from "./components/DocTabs";
import { Error404 } from "./components/errors";
import File from "./components/File";
import FileList from "./components/FileList";
import { FileStoreProvider } from "./stores/FileStore";
import GoogleOAuth2Callback from "./components/GoogleOAuth2Callback";
import GraphList from "./components/GraphList";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import PageLayout from "./components/PageLayout";
import ProjectList from "./components/ProjectList";
import ProjectSettings from "./components/ProjectSettings";
import Resource from "./components/Resource";
import ResourceGraph from "./components/ResourceGraph";
import ResourceList from "./components/ResourceList";
import ResourceListGraph from "./components/ResourceListGraph";
import Search from "./components/Search";
import SearchGraph from "./components/SearchGraph";
import SettingsBigQuery from "./components/SettingsBigQuery";
import SyncGoogleDrive from "./components/syncSources/SyncGoogleDrive";
import UploadDoc from "./components/UploadDoc";
import displayConfig from "./displayConfig";
import { ChatStoreProvider } from "./stores/ChatStore";
import { CurrentProjectStoreProvider } from "./stores/CurrentProjectStore";
import { DocStoreProvider } from "./stores/DocStore";
import { AuthProvider } from "./supabase";
import { getDesignTokens } from "./theme";

// ----------
// SWR Config
// ----------

const swrConfig = {
  onError: (error: any) => {
    console.error(error);
  },
};

// --------------
// Backend Config
// --------------

const backendUrl = process.env.REACT_APP_BACKEND_URL;
if (backendUrl === undefined) throw Error("Missing REACT_APP_BACKEND_URL");
OpenAPI.BASE = backendUrl;
axios.defaults.timeout = 8000;

// ---
// App
// ---

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        ...getDesignTokens(prefersDarkMode ? "dark" : "light"),
        typography: {
          fontFamily: "Ubuntu, sans-serif",
        },
      }),
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

  const router = createBrowserRouter([
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
            {
              path: `/node/:nodeTypeId`,
              element: <ResourceListGraph />,
            },
            {
              path: `/node/:nodeTypeId/:nodeId`,
              element: <ResourceGraph />,
            },
            { path: "/api-docs", element: <ApiDocs /> },
            {
              path: "/search",
              element: <Search key={Date.now()} />,
            },
            {
              path: "/search-graph",
              element: <SearchGraph key={Date.now()} />,
            },
            { path: "/credits", element: <Credits /> },
            {
              path: "/log-in",
              element: <LogIn darkMode={prefersDarkMode} />,
            },
            {
              path: "/account",
              element: <Account />,
            },
            { path: "/chat", element: <Chat fullScreen={true} /> },
            {
              path: "/doc",
              element: <DocTabs />,
              children: [
                { path: "/doc", element: <UploadDoc /> },
                { path: "/doc/annotate", element: <Annotate /> },
              ],
            },
            {
              path: "/projects",
              element: <ProjectList />,
            },
            {
              path: "/:username/:projectName/settings",
              element: <ProjectSettings />,
            },
            {
              path: "/:username/:projectName/files",
              element: <FileList />,
            },
            {
              path: "/:username/:projectName/file/:id",
              element: <File />,
            },
            {
              // folder view; SyncedFile will also redirect here
              path: "/:username/:projectName/file/folder/:id",
              element: <FileList />,
            },
            {
              path: "/:username/:projectName/datasets",
              element: <DatasetList />,
            },
            {
              path: "/:username/:projectName/dataset/:id",
              element: <Dataset />,
            },
            {
              path: "/:username/:projectName/dataset/:id/settings",
              element: <DatasetSettings />,
            },
            {
              path: "/:username/:projectName/graphs",
              element: <GraphList />,
            },
            {
              path: "/:username/:projectName/sync/google-drive",
              element: <SyncGoogleDrive />,
            },
            {
              path: "/account/bigquery",
              element: <SettingsBigQuery />,
            },
            {
              path: "/google-oauth2-callback",
              element: <GoogleOAuth2Callback />,
            },
            { path: "/*", element: <Error404 /> },
          ],
        },
      ],
    },
  ]);

  const compose = (providers: any) =>
    providers.reduce((Prev: any, Curr: any) => ({ children }: any) => (
      <Prev>
        <Curr>{children}</Curr>
      </Prev>
    ));

  const Providers = compose([
    ChatStoreProvider,
    DocStoreProvider,
    FileStoreProvider,
    CurrentProjectStoreProvider,
    // after stores so that auth can clear them
    AuthProvider,
  ]);

  return (
    // Stores should be outside auth, so that auth events can clear the stores.
    <Providers>
      <SWRConfig value={swrConfig}>
        <RouterProvider router={router} />
      </SWRConfig>
    </Providers>
  );
}
