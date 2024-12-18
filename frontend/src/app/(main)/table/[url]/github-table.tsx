"use client";

import React from "react";

import Papa, { ParseResult } from "papaparse";

import CSVTable from "@/components/csv-table";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { detectHeaderRow } from "@/utils/tables";

export default function GithubTable({ url }: { url: string }) {
  const [rawData, setRawData] = React.useState<Array<Array<string>>>([]);
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [headers, setHeaders] = React.useState<Array<string>>([]);
  const [parsedData, setParsedData] = React.useState<Array<Array<string>>>([]);

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
          // TODO handsontable performance is pretty bad without virtualization,
          // so we'll need that
          Range: "bytes=0-5000",
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
    <CSVTable
      setHasHeader={setHasHeader}
      hasHeader={hasHeader}
      headers={headers}
      parsedData={parsedData}
    />
  );
}
