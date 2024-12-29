"use client";

import React from "react";

import Papa, { ParseResult } from "papaparse";

import CSVTable from "@/components/csv-table";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { createClient } from "@/utils/supabase/client";
import { detectHeaderRow } from "@/utils/tables";

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
  const supabase = createClient();

  const [rawData, setRawData] = React.useState<Array<Array<string>>>([]);
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [headers, setHeaders] = React.useState<Array<string>>([]);
  const [parsedData, setParsedData] = React.useState<Array<Array<string>>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const updateTableData = (rows: string[][], headerEnabled: boolean) => {
    if (headerEnabled && rows.length > 0) {
      setHeaders(rows[0]);
      setParsedData(rows.slice(1));
    } else {
      setHeaders(Array(rows[0]?.length || 0).fill(""));
      setParsedData(rows);
    }
  };

  React.useEffect(() => {
    updateTableData(rawData, hasHeader);
  }, [hasHeader]);

  useAsyncEffect(
    async () => {
      const { data } = await supabase.storage
        .from(bucketId)
        .download(objectPath);
      if (!data) return;
      const text = await data.text();
      Papa.parse(text, {
        complete: (results: ParseResult<string[]>) => {
          const rows = results.data;
          setRawData(rows);
          const detectedHeader = detectHeaderRow(rows);
          setHasHeader(detectedHeader);
          updateTableData(rows, detectedHeader);
        },
      });
    },
    async () => {},
    [bucketId, objectPath]
  );

  return (
    <>
      {isLoading && <MiniLoadingSpinner />}
      <CSVTable
        hasHeader={hasHeader}
        headers={headers}
        parsedData={parsedData}
        prefixedId={prefixedId}
        onLoadingChange={setIsLoading}
      />
    </>
  );
}
