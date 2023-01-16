import { ThemeProvider, Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Outlet } from "react-router-dom";

import Navigation from "./Navigation";

export default function PageLayout({ theme }: { theme: Theme }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navigation>
        <Outlet />
      </Navigation>
    </ThemeProvider>
  );
}
