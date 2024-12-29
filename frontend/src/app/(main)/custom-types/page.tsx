/**
 * Custom Types page.
 */

import { Plus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
} from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";
import { createClient } from "@/utils/supabase/server";

import DeleteCustomTypeButton from "./DeleteCustomTypeButton";

export const metadata: Metadata = {
  title: "Brainshare - Custom Types",
  description: "View and manage your custom types",
};

export default async function CustomTypesList() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/log-in?redirect=/custom-types");
  }

  const { data: customTypes, error } = await supabase
    .from("custom_type")
    .select()
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching custom types:", error);
    return (
      <div className="p-6 sm:p-10">
        <p className="text-destructive">Failed to load custom types</p>
      </div>
    );
  }

  return (
    <Stack
      direction="col"
      alignItems="start"
      justifyContent="start"
      className="p-6 sm:p-10 w-full min-h-[calc(100vh-64px)] flex flex-col"
      gap={8}
    >
      <Stack
        direction="row"
        gap={2}
        alignItems="start"
        justifyContent="between"
        className="w-full"
      >
        <H3>Custom Types</H3>
        <Button asChild size="sm" disabled>
          <Link href="/custom-type/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Type
          </Link>
        </Button>
      </Stack>

      <List className="w-full">
        {customTypes?.length === 0 ? (
          <p className="text-muted-foreground">No custom types created yet</p>
        ) : (
          customTypes?.map((type) => (
            <ListItem key={type.id}>
              <ListItemContent>
                <div>
                  <strong>{type.name}</strong>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </ListItemContent>
              <ListItemActions>
                <DeleteCustomTypeButton typeId={type.id} />
              </ListItemActions>
            </ListItem>
          ))
        )}
      </List>
    </Stack>
  );
}
