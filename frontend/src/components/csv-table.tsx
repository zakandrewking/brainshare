/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/dist/handsontable.full.min.css";
import Papa, { ParseResult } from "papaparse";
import React from "react";
import { toast } from "sonner";
import { registerAllModules } from "handsontable/registry";

import { HotTable } from "@handsontable/react";

import { useAsyncEffect } from "@/hooks/use-async-effect";

import { Button } from "./ui/button";

registerAllModules();

interface CSVTableProps {
  url: string;
}

// const openai = new OpenAI({
//   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true,
// });

function detectHeaderRow(rows: string[][]): boolean {
  if (rows.length < 2) return false;

  const firstRow = rows[0];
  const secondRow = rows[1];

  // Strategy 1: Check if first row has different data types than subsequent rows
  const firstRowNumericCount = firstRow.filter(
    (cell) => cell.length != 0 && !isNaN(Number(cell))
  ).length;
  const secondRowNumericCount = secondRow.filter(
    (cell) => cell.length != 0 && !isNaN(Number(cell))
  ).length;

  // If first row has significantly fewer numbers than second row, it's likely a header
  if (firstRowNumericCount === 0 && secondRowNumericCount > 0) {
    return true;
  }

  // Strategy 2: Check if first row is shorter in length than other cells
  const firstRowAvgLength =
    firstRow.reduce((sum, cell) => sum + cell.length, 0) / firstRow.length;
  const secondRowAvgLength =
    secondRow.reduce((sum, cell) => sum + cell.length, 0) / secondRow.length;

  if (firstRowAvgLength < secondRowAvgLength * 0.5) {
    return true;
  }

  return false;
}

function isProteinColumn(header: string): boolean {
  const proteinPatterns = [
    /protein/i,
    /prot[\s_-]?id/i,
    /protein[\s_-]?identifier/i,
  ];
  return proteinPatterns.some((pattern) => pattern.test(header));
}

export default function CSVTable({ url }: CSVTableProps) {
  const [parsedData, setParsedData] = React.useState<Array<Array<string>>>([]);
  const [headers, setHeaders] = React.useState<Array<string>>([]);
  const [columnTypes, setColumnTypes] = React.useState<Record<number, string>>(
    {}
  );
  const [hasHeader, setHasHeader] = React.useState<boolean>(true);
  const [rawData, setRawData] = React.useState<Array<Array<string>>>([]);

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

  const updateTableData = (rows: string[][], headerEnabled: boolean) => {
    if (headerEnabled && rows.length > 0) {
      setHeaders(rows[0]);
      setParsedData(rows.slice(1));
    } else {
      setHeaders(Array(rows[0]?.length || 0).fill(""));
      setParsedData(rows);
    }
  };

  const toggleHeader = () => {
    setHasHeader(!hasHeader);
    updateTableData(rawData, !hasHeader);
  };

  const handleTypeChange = (columnIndex: number, type: string) => {
    setColumnTypes((prev) => ({
      ...prev,
      [columnIndex]: type,
    }));
  };

  const handleDetectDisplayCode = async (columnIndex: number) => {
    try {
      const columnName = headers[columnIndex];
      const firstFiveRows = parsedData
        .slice(0, 5)
        .map((row) => row[columnIndex]);

      const prompt = `Analyze this column of data:
Column name: ${columnName}
First 5 values: ${firstFiveRows.join(", ")}

Please provide a brief summary of what type of data this appears to be and any patterns you notice.`;

      // const completion = await openai.chat.completions.create({
      //   messages: [{ role: "user", content: prompt }],
      //   model: "gpt-3.5-turbo",
      // });

      // const summary = completion.choices[0]?.message?.content;
      // console.log(`Analysis for column "${columnName}":`);
      // console.log(summary);

      // TODO
      // https://github.com/TanStack/table/issues/3636

      toast.success("Analysis complete! Check the console for details.");
    } catch (error) {
      console.error("Error analyzing column:", error);
      toast.error("Failed to analyze column");
    }
  };

  if (!parsedData.length) return <div>Loading...</div>;

  return (
    <div>
      {/* <Protein3DViewer /> */}
      <div className="mb-4">
        <Button onClick={toggleHeader} variant="ghost">
          {hasHeader ? "Disable Header Row" : "Enable Header Row"}
        </Button>
      </div>
      <HotTable
        data={parsedData}
        colHeaders={headers}
        rowHeaders={true}
        // colWidths={120}
        // rowHeights={20}
        // autoRowSize={false}
        // autoColumnSize={false}
        manualColumnResize={false}
        manualRowResize={false}
        readOnly={true}
        height="auto"
        wordWrap={false}
        autoWrapRow={false}
        autoWrapCol={false}
        contextMenu={["copy", "cut"]}
        licenseKey="non-commercial-and-evaluation" // for non-commercial use only
      />
      {/* <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {isProteinColumn(header) ? (
                        <TypeSelector
                          header={header}
                          onTypeChange={(type) => handleTypeChange(index, type)}
                        />
                      ) : (
                        header
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDetectDisplayCode(index)}
                        >
                          Detect Display Code
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {parsedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div> */}
    </div>
  );
}
