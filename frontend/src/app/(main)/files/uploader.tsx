"use client";

import { useState } from "react";

import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import useIsSSR from "@/hooks/useIsSSR";
import { useSupabase } from "@/lib/supabase";

const FILE_BUCKET = "files";

export default function Uploader() {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const isSSR = useIsSSR();
  const supabase = useSupabase();
  const { userId } = useAuth();

  const handleUpload = () => {
    if (!supabase) {
      return;
    }
    const inputElement = document.getElementById("files") as HTMLInputElement;
    const acceptedFiles = Array.from(inputElement.files || []);
    acceptedFiles.forEach(async (file) => {
      const fileName = crypto.randomUUID();
      const { data: storageData, error: storageError } = await supabase!.storage
        .from(FILE_BUCKET)
        .upload(fileName, file);
      if (storageError) {
        setUploadStatus("Error");
        throw Error(`${storageError.name} - ${storageError.message}`);
      }
      const { data: fileData, error: fileError } = await supabase
        .from("file")
        .insert({
          name: file.name,
          size: file.size,
          bucket_id: FILE_BUCKET,
          object_path: storageData.path,
          user_id: userId!,
        })
        .select("*")
        .single();
      if (fileError) {
        setUploadStatus("Error");
        throw Error(fileError.message);
      }
    });
    setUploadStatus("Upload complete");
  };

  const handleChange = () => {
    setUploadStatus(null);
  };

  return (
    <>
      <Label htmlFor="files">Click to choose files or drag and drop:</Label>
      <Stack direction="row" gap={2}>
        <Input
          id="files"
          type="file"
          multiple
          disabled={isSSR}
          onChange={handleChange}
        />
        <Button onClick={handleUpload} disabled={isSSR}>
          Upload
        </Button>
      </Stack>
      {uploadStatus && <p>{uploadStatus}</p>}
    </>
  );
}
