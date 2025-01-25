/**
 * Load CSV data from a file
 */

"use client";

import React from "react";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { useEditStore } from "@/stores/edit-store";
import { parseCsv } from "@/utils/csv";
import { createClient } from "@/utils/supabase/client";

interface FileTableProps {
  bucketId: string;
  objectPath: string;
  prefixedId: string;
}

export default function FileTable({
  bucketId,
  objectPath,
  prefixedId,
}: FileTableProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const editStore = useEditStore();

  const supabase = createClient();

  useAsyncEffect(
    async () => {
      // if we've already loaded this table, don't load it again
      if (editStore.prefixedId === prefixedId) {
        setIsLoading(false);
        return;
      }

      editStore.reset();
      const { data } = await supabase.storage
        .from(bucketId)
        .download(objectPath);
      if (!data) return;
      const text = await data.text();
      const { headers, parsedData } = await parseCsv(text);
      editStore.setData({
        prefixedId,
        headers,
        parsedData,
      });
      setIsLoading(false);
    },
    async () => {},
    [bucketId, objectPath]
  );

  if (isLoading) {
    return <MiniLoadingSpinner />;
  }

  return <CSVTable prefixedId={prefixedId} />;
}
