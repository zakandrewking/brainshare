"use client";

import useSWR from "swr";

import { useSupabase } from "@/lib/supabaseClient";

export default function AppView({ id }: { id: string }) {
  const supabase = useSupabase();

  const { data: app, error } = useSWR(
    supabase ? `/apps/${id}` : null,
    async () => {
      const { data, error } = await supabase!
        .from("app")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return <div>{app?.name}</div>;
}
