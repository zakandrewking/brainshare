/**
 * Load CSV data from a file
 */

"use client";

import React from "react";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { useEditStoreHooks } from "@/stores/edit-store";
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
  const supabase = createClient();

  // edit store
  const editHooks = useEditStoreHooks();
  const prefixedIdFromStore = editHooks.usePrefixedId();
  const resetEditStore = editHooks.useReset();
  const setData = editHooks.useSetData();

  useAsyncEffect(
    async () => {
      // if we've already loaded this table, don't load it again
      if (prefixedIdFromStore === prefixedId) {
        setIsLoading(false);
        return;
      }

      resetEditStore();
      const { data } = await supabase.storage
        .from(bucketId)
        .download(objectPath);
      if (!data) return;
      const text = await data.text();
      const { headers, parsedData } = await parseCsv(text);
      setData({
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
