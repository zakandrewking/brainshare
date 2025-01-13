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
import { getUser } from "@/utils/supabase/server";
import { logInRedirect } from "@/utils/url";

import { InternalLink } from "../ui/link";
import DeleteCustomTypeButton from "./DeleteCustomTypeButton";

export const metadata: Metadata = {
  title: "Brainshare - Custom Types",
  description: "View and manage your custom types",
};

export default async function TypesList({ isPublic }: { isPublic: boolean }) {
  const { user, supabase } = await getUser();

  if (!isPublic && !user) {
    redirect(logInRedirect("/my-types"));
  }

  // Get both user's types and public types from others
  let sel = supabase.from("custom_type").select();
  if (isPublic) {
    sel = sel.eq("public", true);
  } else if (user) {
    sel = sel.eq("public", false).eq("user_id", user.id);
  } else {
    throw new Error("Not authenticated and not public");
  }
  const { data: customTypes, error } = await sel.order("created_at", {
    ascending: false,
  });

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
        <H3>{isPublic ? "Public Types" : "My Types"}</H3>
        <div className="text-sm text-muted-foreground">
          To create a new type:
          <ol className="list-decimal ml-5 mt-1">
            <li>Open a file or table</li>
            <li>Click the menu button (&quot;...&quot;) on a column</li>
            <li>Choose &quot;create a new type for this column&quot;</li>
          </ol>
          <span>
            or try the{" "}
            <InternalLink href="/type-generator">Type Generator</InternalLink>
          </span>
        </div>
      </Stack>

      <List className="w-full">
        {customTypes?.length === 0 ? (
          <p className="text-muted-foreground">
            No {isPublic ? "public" : "my"} types created yet
          </p>
        ) : (
          customTypes?.map((type) => (
            <ListItem key={type.id}>
              <ListItemContent href={`/type/${type.name}`}>
                {type.name}
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
