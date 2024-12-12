/**
 * Files page.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";

import FileDrag from "@/components/file-drag";
import Container from "@/components/ui/container";
import {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
} from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";
import { createClient } from "@/utils/supabase/server";

import AppFileUploader from "../app/[id]/uploader";
import DeleteFileButton from "./DeleteFileButton";

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
    <Container>
      <FileDrag>
        <Stack direction="col" gap={2} alignItems="start">
          <H3>File list</H3>
          <AppFileUploader appId={"TODO"} />
          <List>
            {files?.map((file: any) => (
              <ListItem key={file.id}>
                <ListItemContent href={`/file/${file.id}`}>
                  {file.name} ({file.size} bytes)
                </ListItemContent>
                <ListItemActions>
                  <DeleteFileButton fileId={file.id} />
                </ListItemActions>
              </ListItem>
            ))}
          </List>
        </Stack>
      </FileDrag>
    </Container>
  );
}
