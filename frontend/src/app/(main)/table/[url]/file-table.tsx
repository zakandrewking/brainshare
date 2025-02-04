/**
 * Load CSV data from a file
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
import { createClient, useUser } from "@/utils/supabase/client";

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
  const user = useUser();

  const idHooks = useIdentificationStoreHooks();
  const idStoreLoadWithPrefixedId = idHooks.useLoadWithPrefixedId();
  const prefixedIdFromStore = editHooks.usePrefixedId();
  const resetWithPrefixedId = editHooks.useResetWithPrefixedId();
  const setData = editHooks.useSetData();

  const widgetHooks = useWidgetStoreHooks();
  const widgetStoreLoadWithPrefixedId = widgetHooks.useLoadWithPrefixedId();

  useAsyncEffect(
    async () => {
      // if we've already loaded this table, don't load it again
      if (prefixedIdFromStore === prefixedId) {
        setIsLoading(false);
        return;
      }

      resetWithPrefixedId(prefixedId);
      const { data } = await supabase.storage
        .from(bucketId)
        .download(objectPath);
      if (!data) return;
      const text = await data.text();
      const { headers, parsedData } = await parseCsv(text);
      setData({ headers, parsedData });
      setIsLoading(false);
    },
    async () => {},
    [bucketId, objectPath]
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
