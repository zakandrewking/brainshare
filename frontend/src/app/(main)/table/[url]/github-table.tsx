"use client";

import React from "react";

import { Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";

import CSVTable from "@/components/csv-table";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { detectHeaderRow } from "@/utils/tables";
import { cn } from "@/utils/tailwind";

interface GitHubTableProps {
  url: string;
  prefixedId: string;
}

export default function GitHubTable({ url, prefixedId }: GitHubTableProps) {
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
      const response = await fetch(url, {
        headers: {
          // Range: "bytes=0-5000",
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
    [url]
  );

  return (
    <>
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
