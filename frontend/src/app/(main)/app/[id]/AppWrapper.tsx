"use client";

import { SWRConfig } from "swr";

import { AppType, getAppKey } from "@/swr/getApp";

import AppView from "./AppView";

export default function AppWrapper({ app }: { app: AppType }) {
  const fallback = { [getAppKey(app.id)]: app };
  return (
    <SWRConfig value={{ fallback }}>
      <AppView id={app.id} />
    </SWRConfig>
  );
}
