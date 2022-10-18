import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  createBrowserRouter,
  RouterProvider,
  ScrollRestoration,
  useOutlet,
} from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import { getDesignTokens } from "./theme";
import Chemical from "./components/Chemical";
import Chemicals from "./components/Chemicals";
import Docs from "./components/Docs";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import PageLayout from "./components/PageLayout";
import Search from "./components/Search";
import Storage from "./components/Storage";

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

  const theme = React.useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? "dark" : "light")),
    [prefersDarkMode]
  );

  const router = createBrowserRouter([
    {
      element: <ReactRouterRoot />,
      children: [
        {
          element: <PageLayout />,
          children: [
            { path: "/", element: <Home /> },
            { path: "/chemicals", element: <Chemicals /> },
            { path: "/chemicals/:id", element: <Chemical /> },
            { path: "/docs", element: <Docs /> },
            { path: "/search", element: <Search /> },
            { path: "/storage", element: <Storage /> },
            {
              path: "/log-in",
              element: <LogIn darkMode={prefersDarkMode} />,
            },
          ],
        },
      ],
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
