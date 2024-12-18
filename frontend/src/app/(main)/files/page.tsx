/**
 * Files page.
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

import DeleteFileButton from "./DeleteFileButton";
import FileUploader from "./file-uploader";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

export default async function FileList() {
  const supabase = await createClient();

  // TODO how to ensure this is not cached by next?
  // https://github.com/supabase/supabase-js/issues/725#issuecomment-1578811299
  const { data: files, error } = await supabase.from("file").select();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/log-in?redirect=/files");
  }

  return (
    <Stack
      direction="col"
      alignItems="start"
      justifyContent="start"
      className="p-6 sm:p-10 w-full min-h-[calc(100vh-64px)] flex flex-col"
      gap={8}
    >
      <FileUploader />
      <Stack direction="col" gap={2} alignItems="start">
        <H3>Files</H3>
        <List>
          {files?.map((file: any) => (
            <ListItem key={file.id}>
              <ListItemContent href={`/table/file+${file.id}`}>
                {file.name} ({file.size} bytes)
              </ListItemContent>
              <ListItemActions>
                <DeleteFileButton fileId={file.id} />
              </ListItemActions>
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
