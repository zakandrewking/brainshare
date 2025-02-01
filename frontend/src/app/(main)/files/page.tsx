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
import StorageUsage, { STORAGE_LIMIT_BYTES } from "./storage-usage";

// import StorageUsage from "./storage-usage";

export const metadata: Metadata = {
  title: "Brainshare - Files",
  description: "Upload and manage files",
};

async function getStorageLimit() {
  const { user, supabase } = await getUser();
  if (!user) return { isOverLimit: false, usage: 0 };
  try {
    const { data, error } = await supabase.rpc("get_user_storage_usage");
    if (error) throw error;
    const usage = typeof data === "number" ? data : 0;
    const isOverLimit = usage >= STORAGE_LIMIT_BYTES;
    return { isOverLimit, usage };
  } catch (error) {
    console.error("Error checking storage limit:", error);
  }
  return { isOverLimit: false, usage: 0 };
}

export default async function FileList() {
  const { user, supabase } = await getUser();

  const { isOverLimit, usage } = await getStorageLimit();

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
      <FileUploader isOverLimit={isOverLimit} />
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
      <StorageUsage isOverLimit={isOverLimit} usage={usage} />
    </Stack>
  );
}
