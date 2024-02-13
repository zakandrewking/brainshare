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
import DocTabs from "./components/DocTabs";
import { Error404 } from "./components/errors";
import FileList from "./components/FileListOld";
import { FileStoreProvider } from "./components/FileStore";
import GoogleOAuth2Callback from "./components/GoogleOAuth2Callback";
import GraphList from "./components/GraphList";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import LogOut from "./components/LogOut";
import PageLayout from "./components/PageLayout";
import Resource from "./components/Resource";
import ResourceGraph from "./components/ResourceGraph";
import ResourceList from "./components/ResourceList";
import ResourceListGraph from "./components/ResourceListGraph";
import Search from "./components/Search";
import SearchGraph from "./components/SearchGraph";
import SettingsBigQuery from "./components/SettingsBigQuery";
import SettingsGoogleDrive from "./components/SettingsGoogleDrive";
import File from "./components/File";
import UploadDoc from "./components/UploadDoc";
import displayConfig from "./displayConfig";
import { ChatStoreProvider } from "./stores/ChatStore";
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
              path: "/log-out",
              element: <LogOut />,
            },
            {
              path: "/datasets",
              element: <DatasetList />,
            },
            {
              path: "/dataset/:id",
              element: <Dataset />,
            },
            {
              path: "graphs",
              element: <GraphList />,
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
            { path: "/files", element: <FileList /> },
            { path: "/file/:id", element: <File /> },
            // folder view; SyncedFile will also redirect here
            { path: "/file/folder/:id", element: <FileList /> },
            {
              path: "/account/google-drive",
              element: <SettingsGoogleDrive />,
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
    AuthProvider,
    ChatStoreProvider,
    DocStoreProvider,
    FileStoreProvider,
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
