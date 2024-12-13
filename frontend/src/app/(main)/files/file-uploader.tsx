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
  const [isUploading, setIsUploading] = React.useState(false);
  const isSSR = useIsSSR();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesChange = (newFiles: FileList) => {
    setFiles(newFiles);
    setUploadStatus(null);
  };

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // if (e.target.files && e.target.files.length > 0) {
  //   handleFilesChange(e.target.files);
  // }
  // // Reset the input value so the same file can be selected again
  // if (fileInputRef.current) {
  //   fileInputRef.current.value = "";
  // }
  // };

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
      fileInputRef.current.files = files;
    }
  }, [files]);

  return (
    <FileDrag onFilesChange={handleFilesChange}>
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
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            // onChange={handleInputChange}
            multiple
            disabled={isSSR}
            className="cursor-pointer rounded-none rounded-b-md"
          />
        </Stack>
        <Button
          onClick={handleUpload}
          disabled={
            !files || files.length === 0 || isUploading || isPending || isSSR
          }
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>

        {uploadStatus && (
          <div
            className={`text-sm ${
              uploadStatus.includes("Error")
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {uploadStatus}
          </div>
        )}
      </Stack>
    </FileDrag>
  );
}
