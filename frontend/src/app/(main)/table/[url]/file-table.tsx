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
  const { dispatch, actions } = useEditStore();

  const supabase = createClient();

  useAsyncEffect(
    async () => {
      const { data } = await supabase.storage
        .from(bucketId)
        .download(objectPath);
      if (!data) return;
      const text = await data.text();
      const { headers, parsedData } = await parseCsv(text);
      dispatch(actions.setHeaders(headers));
      dispatch(actions.setParsedData(parsedData));
      setIsLoading(false);
    },
    async () => {},
    [bucketId, objectPath]
  );

  return (
    <>
      {isLoading && <MiniLoadingSpinner />}
      <CSVTable prefixedId={prefixedId} onLoadingChange={setIsLoading} />
    </>
  );
}
