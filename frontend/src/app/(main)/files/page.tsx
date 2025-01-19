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
import { getUser } from "@/utils/supabase/server";
import { logInRedirect } from "@/utils/url";

import DeleteFileButton from "./DeleteFileButton";
import FileUploader from "./file-uploader";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

export default async function FileList() {
  const { user, supabase } = await getUser();

  if (!user) {
    redirect(logInRedirect("/files"));
  }

  // TODO nice error handling
  const { data: files } = await supabase.from("file").select();

  return (
    <Stack
      direction="col"
      alignItems="start"
      justifyContent="start"
      className="p-6 sm:p-10 w-full min-h-[calc(100vh-64px)] flex flex-col"
      gap={8}
    >
      <FileUploader />
      <Stack direction="col" gap={2} alignItems="start" className="w-full">
        <H3>Files</H3>
        <List className="w-full">
          {files?.length === 0 ? (
            <p className="text-muted-foreground">No files uploaded yet</p>
          ) : (
            files?.map((file: any) => (
              <ListItem key={file.id}>
                <ListItemContent href={`/table/file+${file.id}`}>
                  {file.name} ({file.size} bytes)
                </ListItemContent>
                <ListItemActions>
                  <DeleteFileButton fileId={file.id} />
                </ListItemActions>
              </ListItem>
            ))
          )}
        </List>
      </Stack>
    </Stack>
  );
}
