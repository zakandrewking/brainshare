"use client";

import useSWR from "swr";

import { useSupabase } from "@/lib/supabaseClient";

import getApp, { getAppKey } from "./getApp";

export default function useApp(id: string) {
  const supabase = useSupabase();

  const {
    data: app,
    error,
    mutate: mutateApp,
  } = useSWR(
    getAppKey(id),
    async () => {
      const { app, error } = await getApp(id, supabase!);
      if (error) throw error;
      return app;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  return { app, error, mutateApp };
}
