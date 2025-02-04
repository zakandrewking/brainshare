/**
 * Load CSV data from GitHub
 */

"use client";

import React from "react";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { useWidgetStoreHooks } from "@/stores/widget-store";
import { parseCsv } from "@/utils/csv";
import { useUser } from "@/utils/supabase/client";

interface GitHubTableProps {
  url: string;
  prefixedId: string;
}

export default function GitHubTable({ url, prefixedId }: GitHubTableProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  const idHooks = useIdentificationStoreHooks();
  const idStoreLoadWithPrefixedId = idHooks.useLoadWithPrefixedId();
  const prefixedIdFromStore = editHooks.usePrefixedId();
  const resetWithPrefixedId = editHooks.useResetWithPrefixedId();
  const setData = editHooks.useSetData();

  const widgetHooks = useWidgetStoreHooks();
  const widgetStoreLoadWithPrefixedId = widgetHooks.useLoadWithPrefixedId();
  const user = useUser();

  useAsyncEffect(
    async () => {
      // if we've already loaded this table, don't load it again
      if (prefixedIdFromStore === prefixedId) {
        setIsLoading(false);
        return;
      }

      resetWithPrefixedId(prefixedId);
      const response = await fetch(url, {
        headers: {
          // Range: "bytes=0-5000",
        },
      });
      const data = await response.text();
      const { headers, parsedData } = await parseCsv(data);
      setData({
        headers,
        parsedData,
      });
      setIsLoading(false);
    },
    async () => {},
    [url]
  );

  React.useEffect(() => {
    // start loading identifications & widgets; if the prefixed ID is already
    // loaded, this will do nothing
    if (user) {
      idStoreLoadWithPrefixedId(prefixedId);
      widgetStoreLoadWithPrefixedId(prefixedId);
    }
  }, [
    idStoreLoadWithPrefixedId,
    widgetStoreLoadWithPrefixedId,
    prefixedId,
    user,
  ]);

  if (isLoading) {
    return <MiniLoadingSpinner />;
  }

  return <CSVTable prefixedId={prefixedId} />;
}
