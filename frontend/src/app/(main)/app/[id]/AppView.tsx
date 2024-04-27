"use client";

import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";
import { H1, H3 } from "@/components/ui/typography";
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

  // ---------------
  // Computed values
  // ---------------

  const launchUrl = `https://${app?.deploy_subdomain ?? ""}.brainshare.io`;

  return (
    <Stack direction="col" alignItems="start">
      <H3>{app?.name}</H3>
      <ExternalLink href={launchUrl} className="text-xl">
        Launch app
      </ExternalLink>
      {/* <div>{app?.deploy_subdomain_ready ? "Ready" : "Not Ready"}</div> */}
    </Stack>
  );
}
