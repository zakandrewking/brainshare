/**
 * Load CSV data from GitHub
 */

"use client";

import React from "react";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { useEditStoreHooks } from "@/stores/edit-store";
import { parseCsv } from "@/utils/csv";

interface GitHubTableProps {
  url: string;
  prefixedId: string;
}

export default function GitHubTable({ url, prefixedId }: GitHubTableProps) {
  const [isLoading, setIsLoading] = React.useState(true);

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
      const response = await fetch(url, {
        headers: {
          // Range: "bytes=0-5000",
        },
      });
      const data = await response.text();
      const { headers, parsedData } = await parseCsv(data);
      setData({
        prefixedId,
        headers,
        parsedData,
      });
      setIsLoading(false);
    },
    async () => {},
    [url]
  );

  if (isLoading) {
    return <MiniLoadingSpinner />;
  }

  return <CSVTable prefixedId={prefixedId} />;
}
