import { Outlet } from "react-router-dom";

import Navigation from "./Navigation";

export default function PageLayout() {
  return (
    <Navigation>
      <Outlet />
    </Navigation>
  );
}
