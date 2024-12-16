import React from "react";

import { notFound } from "next/navigation";
import Papa from "papaparse";

import CSVTable from "@/components/csv-table";
import { createClient } from "@/utils/supabase/server";

interface PageProps {
  params: {
    url: string;
  };
}

export default async function FileTablePage({ params }: PageProps) {
  const supabase = await createClient();

  // Remove 'file+' prefix and decode
  const objectPath = decodeURIComponent(params.url.replace("file%2B", ""));

  // Get file metadata from database
  const { data: fileData, error: fileError } = await supabase
    .from("file")
    .select("*")
    .eq("object_path", objectPath)
    .single();

  if (fileError || !fileData) {
    console.error("File not found:", fileError);
    return notFound();
  }

  // Get file content from storage
  const { data: fileContent, error: storageError } = await supabase.storage
    .from(fileData.bucket_id)
    .download(fileData.object_path);

  if (storageError || !fileContent) {
    console.error("File content not found:", storageError);
    return notFound();
  }

  // Convert blob to text
  const csvContent = await fileContent.text();
  const parsedData = Papa.parse(csvContent);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">{fileData.name}</h1>
      <CSVTable data={parsedData.data} />
    </div>
  );
}
