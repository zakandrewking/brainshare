/**
 * Custom Types page.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";

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

  console.log(customTypes, error);

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
        <div className="text-sm text-muted-foreground">
          To create a new type:
          <ol className="list-decimal ml-5 mt-1">
            <li>Open a file or table</li>
            <li>Click the menu button (&quot;...&quot;) on a column</li>
            <li>Choose &quot;create a new type for this column&quot;</li>
          </ol>
        </div>
      </Stack>

      <List className="w-full">
        {customTypes?.length === 0 ? (
          <p className="text-muted-foreground">No custom types created yet</p>
        ) : (
          customTypes?.map((type) => (
            <ListItem key={type.id}>
              <ListItemContent href={`/custom-type/${type.id}`}>
                {type.name}
              </ListItemContent>
              <ListItemActions>
                <DeleteCustomTypeButton typeId={type.id} disabled />
              </ListItemActions>
            </ListItem>
          ))
        )}
      </List>
    </Stack>
  );
}
