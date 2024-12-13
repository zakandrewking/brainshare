/**
 * File uploader runs client side for performance.
 */

"use client";

import React from "react";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import FileDrag from "@/components/file-drag";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import useIsSSR from "@/hooks/use-is-ssr";
import supabase from "@/utils/supabase/client";
import { nanoid } from "@/utils/tailwind";

const FILE_BUCKET = "files";

export default function FileUploader() {
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const isSSR = useIsSSR();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleFilesChange = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setUploadStatus(null);
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus("No files selected");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading...");

    try {
      for (const file of files) {
        const fileName = nanoid();
        const { error: storageError } = await supabase.storage
          .from(FILE_BUCKET)
          .upload(fileName, file);

        if (storageError) {
          throw Error(`${storageError.name} - ${storageError.message}`);
        }
      }

      setUploadStatus("Upload complete");
      setFiles([]);

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

  return (
    <FileDrag onFilesChange={handleFilesChange}>
      <Stack className="w-full max-w-xl mx-auto p-4 space-y-4">
        <div className="min-h-[100px] p-4 border rounded-lg">
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Drag and drop files here or click to select
            </p>
          ) : (
            <Stack>
              <Label>Selected files: {files.length}</Label>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-background rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </Stack>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || isPending || isSSR}
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
