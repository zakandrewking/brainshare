import React from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import PageLayout from "./components/PageLayout";
import Home from "./components/Home";
import LogIn from "./components/LogIn";
import { getDesignTokens } from "./theme";

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? "dark" : "light")),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<PageLayout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/log-in"
              element={<LogIn darkMode={prefersDarkMode} />}
            />
            {/* <Route path="/log-out" /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
