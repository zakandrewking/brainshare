/**
 * File uploader runs client side for performance.
 */

"use client";

import React from "react";

import { useRouter } from "next/navigation";

import FileDrag from "@/components/file-drag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import useIsSSR from "@/hooks/use-is-ssr";
import { createClient, useUser } from "@/utils/supabase/client";
import { nanoid } from "@/utils/tailwind";

const FILE_BUCKET = "files";

export default function FileUploader({
  isOverLimit,
}: {
  isOverLimit: boolean;
}) {
  const user = useUser();
  const supabase = createClient();

  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [droppedFiles, setDroppedFiles] = React.useState<FileList | null>(null);
  const [failedFiles, setFailedFiles] = React.useState<FileList | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const isSSR = useIsSSR();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadFiles = async (filesToUpload: FileList) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");
    setFailedFiles(null);

    try {
      for (const file of Array.from(filesToUpload)) {
        const id = nanoid();
        const extension = file.name.split(".").pop();
        const objectPath = extension === file.name ? id : `${id}.${extension}`;
        const { error: storageError } = await supabase.storage
          .from(FILE_BUCKET)
          .upload(objectPath, file);

        if (storageError) {
          // Check if it's a storage limit error
          if (storageError.message.toLowerCase().includes("storage limit")) {
            throw new Error(
              "Storage limit reached. Please delete some files first."
            );
          }
          throw Error(storageError.message);
        }

        const { error: dbError } = await supabase.from("file").insert({
          id: id,
          name: file.name,
          size: file.size,
          bucket_id: FILE_BUCKET,
          object_path: objectPath,
          user_id: user.id,
        });

        if (dbError) {
          // Check if it's a storage limit error
          if (dbError.message.toLowerCase().includes("storage limit")) {
            throw new Error(
              "Storage limit reached. Please delete some files first."
            );
          }
          throw Error(dbError.message);
        }
      }

      setUploadStatus("Upload complete");
      setFailedFiles(null);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setUploadStatus(
        error instanceof Error ? error.message : "Error uploading"
      );
      setFailedFiles(filesToUpload);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (newFiles: FileList) => {
    setDroppedFiles(newFiles);
    uploadFiles(newFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles) {
      uploadFiles(newFiles);
    }
  };

  React.useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.files = droppedFiles;
    }
  }, [droppedFiles]);

  const isDisabled = isUploading || isPending || isSSR || isOverLimit;

  return (
    <FileDrag onFilesChange={handleFileDrop}>
      <Stack alignItems="end" gap={1} className="w-full">
        <Stack alignItems="start" gap={0} className="w-full">
          <Button
            variant="secondary"
            className="w-full rounded-none rounded-t-md cursor-pointer"
            disabled={isDisabled}
          >
            <Label htmlFor="file-upload">
              Click to select OR drag-and-drop
            </Label>
          </Button>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleInputChange}
            multiple
            disabled={isDisabled}
            className="cursor-pointer rounded-none rounded-b-md"
          />
        </Stack>
        {uploadStatus && (
          <Stack direction="row" gap={2} className="items-center">
            <div
              className={`text-sm px-2 py-1 rounded-sm ${
                uploadStatus.includes("Error") || uploadStatus.includes("limit")
                  ? "text-destructive-foreground bg-destructive"
                  : "text-muted-foreground bg-muted"
              }`}
            >
              {uploadStatus}
            </div>
            {(uploadStatus.includes("Error") ||
              uploadStatus.includes("limit")) &&
              failedFiles && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => uploadFiles(failedFiles)}
                  disabled={isDisabled}
                >
                  Try Again
                </Button>
              )}
          </Stack>
        )}
      </Stack>
    </FileDrag>
  );
}
