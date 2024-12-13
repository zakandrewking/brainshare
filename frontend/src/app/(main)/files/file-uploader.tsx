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
import supabase from "@/utils/supabase/client";
import { nanoid } from "@/utils/tailwind";

const FILE_BUCKET = "files";

export default function FileUploader() {
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [droppedFiles, setDroppedFiles] = React.useState<FileList | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const isSSR = useIsSSR();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileDrop = (newFiles: FileList) => {
    setDroppedFiles(newFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      for (const file of Array.from(files)) {
        const fileName = nanoid();
        const { error: storageError } = await supabase.storage
          .from(FILE_BUCKET)
          .upload(fileName, file);

        if (storageError) {
          throw Error(`${storageError.name} - ${storageError.message}`);
        }
      }

      setUploadStatus("Upload complete");
      setFiles(null);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setUploadStatus("Error uploading");
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.files = droppedFiles;
      setFiles(droppedFiles);
    }
  }, [droppedFiles]);

  return (
    <FileDrag onFilesChange={handleFileDrop}>
      <Stack alignItems="start" gap={6}>
        <Stack alignItems="start" gap={0}>
          <Button
            variant="secondary"
            className="w-full rounded-none rounded-t-md cursor-pointer"
            asChild
          >
            <Label htmlFor="file-upload">
              Click to select OR drag-and-drop
            </Label>
          </Button>
          {/* TODO for custom styling, just make input hidden */}
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleInputChange}
            multiple
            disabled={isSSR}
            className="cursor-pointer rounded-none rounded-b-md"
          />
        </Stack>
        <Stack direction="row" justifyContent="center" gap={4}>
          <Button
            onClick={handleUpload}
            disabled={
              !files || files.length === 0 || isUploading || isPending || isSSR
            }
          >
            Upload
          </Button>

          {uploadStatus && (
            <div
              className={`text-sm px-2 py-1 rounded-sm ${
                uploadStatus.includes("Error")
                  ? "text-destructive-foreground bg-destructive"
                  : "text-muted-foreground bg-muted"
              }`}
            >
              {uploadStatus}
            </div>
          )}
        </Stack>
      </Stack>
    </FileDrag>
  );
}
