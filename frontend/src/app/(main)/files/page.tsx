/**
 * Files page.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";

import Container from "@/components/ui/container";
import { H3 } from "@/components/ui/typography";
import { createClient } from "@/utils/supabase/server";

import FileUploader from "./file-uploader";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

export default async function FileList() {
  const supabase = await createClient();

  // TODO how to ensure this is not cached by next?
  // https://github.com/supabase/supabase-js/issues/725#issuecomment-1578811299
  // const { data: files, error } = await supabase.from("file").select();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/log-in?redirect=/files");
  }

  return (
    <Container className="min-h-[calc(100vh-64px)] flex flex-col">
      <H3>File list</H3>
      <FileUploader />
      {/* <List> */}
      {/* {files?.map((file: any) => (
              <ListItem key={file.id}>
                <ListItemContent href={`/file/${file.id}`}>
                  {file.name} ({file.size} bytes)
                </ListItemContent>
                <ListItemActions>
                  <DeleteFileButton fileId={file.id} />
                </ListItemActions>
              </ListItem>
            ))} */}
      {/* </List> */}
    </Container>
  );
}
