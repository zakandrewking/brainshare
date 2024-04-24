/**
 * Design Spec:
 * - Style of a list of resources with action buttons
 */

"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { useSupabase } from "@/lib/supabaseClient";

import CreateAppDialog from "./CreateAppDialog";

export default function AppListView() {
  const supabase = useSupabase();
  const { userId } = useAuth();

  // ------------
  // Data loading
  // ------------

  const {
    data: apps,
    isLoading,
    error,
    mutate,
  } = useSWR(
    supabase && "/apps",
    async () => {
      const { data, error } = await supabase!.from("app").select("*");
      if (error) throw error;
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // -------------
  // Session check
  // -------------

  // TODO Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

  if (!userId) {
    throw Error("Not implemented");
  }

  // --------
  // Handlers
  // --------

  const handleDeleteApp = async (appId: string) => {
    const { error } = await supabase!.from("app").delete().eq("id", appId);
    if (error) throw error;
    // if error, show snackbar
    mutate((apps) => apps?.filter((app) => app.id !== appId));
  };

  // ------
  // Render
  // ------

  return (
    <Container>
      <Stack direction="col" gap={5} alignItems="start">
        <CreateAppDialog />

        {apps?.map((app) => (
          <Stack direction="row" key={app.id} gap={2}>
            <div>{app.name}</div>
            <Button onClick={() => handleDeleteApp(app.id)} variant="ghost">
              {/* TODO confirmation dialog */}
              <X />
            </Button>
          </Stack>
        ))}

        {/* No apps */}
        {apps?.length === 0 && <>No apps</>}

        {/* Spinner */}
        {/* TODO delayed spinner */}

        {/* Error */}
        {error && <>Could not load data</>}
      </Stack>
    </Container>
  );
}
