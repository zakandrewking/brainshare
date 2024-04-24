import { Metadata } from "next";

import AppListView from "./AppList";

export const metadata: Metadata = {
  title: "Brainshare - Apps",
  description: "List of apps",
};

export default function AppList() {
  return <AppListView />;
}
