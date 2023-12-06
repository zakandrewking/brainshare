import { ThemeProvider, Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Outlet } from "react-router-dom";

import Navigation from "./Navigation";
import { ErrorBarProvider } from "../hooks/useErrorBar";

export default function PageLayout({ theme }: { theme: Theme }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBarProvider>
        <Navigation>
          <Outlet />
        </Navigation>
      </ErrorBarProvider>
    </ThemeProvider>
  );
}
