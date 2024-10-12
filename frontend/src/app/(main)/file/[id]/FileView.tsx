"use client";

import useSWR from "swr";

import { DelayedLoadingSpinner, LoadingSpinner } from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { Stack } from "@/components/ui/stack";
import supabase from "@/lib/supabaseClient";

export default function FileView({ id }: { id: string }) {
  const {
    data: file,
    error,
    isLoading,
  } = useSWR(
    `/files/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("file")
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

  return <></>;
}
