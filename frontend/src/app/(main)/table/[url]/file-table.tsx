"use client";

import React from "react";

import { Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";

import CSVTable from "@/components/csv-table";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import supabase from "@/utils/supabase/client";
import { detectHeaderRow } from "@/utils/tables";
import { cn } from "@/utils/tailwind";

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
      const { data: signedUrl } = await supabase.storage
        .from(bucketId)
        .createSignedUrl(objectPath, 60);

      if (!signedUrl?.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      const response = await fetch(signedUrl.signedUrl, {
        headers: {
          //   Range: "bytes=0-5000", // Only get first 5KB for initial load
        },
      });

      const data = await response.text();
      Papa.parse(data, {
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
      {/* TODO move isLoading into a store that's accessible to other operations like saving state.
      we'll need something like https://redux.js.org/usage/side-effects-approaches#listeners to get there */}
      <Loader2
        className={cn(
          "fixed top-[75px] right-[10px] h-4 w-4 animate-spin",
          isLoading ? "block" : "hidden"
        )}
      />
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
