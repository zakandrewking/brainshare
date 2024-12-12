/**
 * Design Spec:
 * - Style of a list of resources with action buttons
 */

"use client";

import { X } from "lucide-react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
} from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import { TextTooltip } from "@/components/ui/tooltip";
import supabase from "@/utils/supabase/client";

import CreateAppDialog from "./CreateAppDialog";

export default function AppListView() {
  // ------------
  // Data loading
  // ------------

  const {
    data: apps,
    isLoading,
    error,
    mutate,
  } = useSWR(
    "/apps",
    async () => {
      const { data, error } = await supabase.from("app").select("*");
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

  // -------------
  // Session check
  // -------------

  // TODO Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

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
      <Stack direction="col" gap={5} alignItems="start" className="w-full">
        <CreateAppDialog />

        <List>
          {apps?.map((app) => (
            <ListItem key={app.id}>
              <ListItemContent href={`/app/${app.id}`}>
                {app.name}
              </ListItemContent>
              <ListItemActions>
                <TextTooltip text="Delete app">
                  <Button
                    onClick={() => handleDeleteApp(app.id)}
                    variant="ghost"
                  >
                    <X />
                  </Button>
                </TextTooltip>
              </ListItemActions>
            </ListItem>
          ))}
        </List>

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
