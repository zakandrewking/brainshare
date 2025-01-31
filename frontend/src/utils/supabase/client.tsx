"use client";

import React from "react";

import { mutate } from "swr";

import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";

import { Database } from "@/database.types";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { useWidgetStoreHooks } from "@/stores/widget-store";

// TODO at some point, we should put the supabase db behind a reverse proxy
// https://www.reddit.com/r/Supabase/comments/17er1xs/site_with_supabase_under_attack/
// Brainshare SDKs will not need the anon key or the database URL -- both will
// be provided by AWS load balancer.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL;
if (!anonKey) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (!apiUrl) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_API_URL");
}

export function createClient() {
  return createBrowserClient<Database>(apiUrl!, anonKey!, {});
}

const UserContext = React.createContext<{ user: User | null }>({
  user: null,
});

export function UserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const resetEditStore = editHooks.useReset();

  const widgetHooks = useWidgetStoreHooks();
  const resetWidgetStore = widgetHooks.useReset();

  const idHooks = useIdentificationStoreHooks();
  const resetIdentificationStore = idHooks.useReset();

  // clear data on log out
  useAsyncEffect(
    async () => {
      if (!user) {
        mutate(() => true, undefined, { revalidate: false });
        resetEditStore();
        resetWidgetStore();
        resetIdentificationStore();
      }
    },
    async () => {},
    [user]
  );

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}
export function useUser() {
  const { user } = React.useContext(UserContext);
  return { user };
}
