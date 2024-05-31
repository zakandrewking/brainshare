/**
 * Files page. Files can be used in multiple apps, and RBAC is handled separately.
 */

import { Metadata } from "next";

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
import { getSupabase } from "@/lib/supabaseServer";

import DeleteFileButton from "./DeleteFileButton";

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
          {/* use the newer Uploader in the app/ directory instead */}
          {/* <Uploader /> */}
          <List>
            {files?.map((file) => (
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
