/**
 * Files page. Files can be used in multiple apps, and RBAC is handled separately.
 */

import { Metadata } from "next";

import FileDrag from "@/components/file-drag";
import Container from "@/components/ui/container";
import { List, ListItem } from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";
import { getSupabase } from "@/lib/supabaseServer";

import DeleteFileButton from "./DeleteFileButton";
import Uploader from "./uploader";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

export default async function FileList() {
  const supabase = await getSupabase();

  // TODO how to ensure this is not cached by next?
  // https://github.com/supabase/supabase-js/issues/725#issuecomment-1578811299
  const { data: files, error } = await supabase.from("file").select();

  return (
    <Container>
      <FileDrag>
        <Stack direction="col" gap={2} alignItems="start">
          <H3>File list</H3>
          <Uploader />
          <List>
            {files?.map((file) => (
              <ListItem key={file.id} href="/files">
                {file.name} ({file.size} bytes)
                <DeleteFileButton
                  fileId={file.id}
                  // control hover behavior of the ListItem
                  className="list-item-action"
                />
              </ListItem>
            ))}
          </List>
        </Stack>
      </FileDrag>
    </Container>
  );
}
