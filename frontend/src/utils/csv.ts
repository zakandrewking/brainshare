import Papa, { ParseResult } from "papaparse";

import { detectHeaderRow } from "./tables";

export async function parseCsv(rawData: string): Promise<{
  headers: string[];
  parsedData: string[][];
}> {
  let headers: string[] = [];
  let parsedData: string[][] = [];
  return new Promise((resolve) => {
    Papa.parse(rawData, {
      complete: (results: ParseResult<string[]>) => {
        const rows = results.data;
        const detectedHeader = detectHeaderRow(rows);
        if (detectedHeader && rows.length > 0) {
          headers = rows[0] || [];
          parsedData = rows.slice(1);
        } else {
          headers = Array(rows[0]?.length || 0).fill("");
          parsedData = rows;
        }
        resolve({ headers, parsedData });
      },
    });
  });
}
