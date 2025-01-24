/**
 * Navigation for the file page
 */

import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbInternalLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Stack } from "@/components/ui/stack";
import { createClient } from "@/utils/supabase/server";

import FileTable from "./file-table";

interface FileTablePageProps {
  url: string;
}

export default async function FileTablePage({ url }: FileTablePageProps) {
  const supabase = await createClient();

  // Remove 'file+' prefix and decode
  const prefixedId = decodeURIComponent(url);
  const id = prefixedId.replace("file+", "");

  // Get file metadata from database
  const { data: fileData, error: fileError } = await supabase
    .from("file")
    .select("bucket_id, object_path, name")
    .eq("id", id)
    .single();

  if (fileError || !fileData) {
    console.error("File not found:", fileError);
    return notFound();
  }

  // Check file size
  const { data, error: storageError } = await supabase.storage
    .from(fileData.bucket_id)
    .info(fileData.object_path);

  if (storageError) {
    console.error("File not accessible:", storageError);
    return notFound();
  }

  if ((data?.size ?? 0) > 1 * 1024 * 1024) {
    return (
      <div className="container mx-auto p-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
          <p>
            This file exceeds the maximum size limit of 1MB. Please try a
            smaller file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Stack
      direction="col"
      gap={2}
      alignItems="start"
      className="w-full px-6 pt-4"
    >
      <Stack
        direction="row"
        gap={2}
        justifyContent="between"
        className="w-full"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbInternalLink href="/files">
                Files
              </BreadcrumbInternalLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{fileData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Stack>
      <FileTable
        bucketId={fileData.bucket_id}
        objectPath={fileData.object_path}
        prefixedId={prefixedId}
      />
    </Stack>
  );
}
