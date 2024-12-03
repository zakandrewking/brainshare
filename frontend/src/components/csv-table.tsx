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

import { compareColumnWithRedis } from "@/actions/compare-column";
import { ColumnIdentification, identifyColumn, type } from "@/actions/identify-column";
import { useAsyncEffect } from "@/hooks/use-async-effect";

import { Button } from "./ui/button";
import {
    DropdownMenu, DropdownMenuContentNoAnimation, DropdownMenuItem, DropdownMenuPortal,
    DropdownMenuTrigger
} from "./ui/dropdown-menu";

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
  const [activeColumn, setActiveColumn] = React.useState<number | null>(null);
  const [buttonRect, setButtonRect] = React.useState<{ left: number; bottom: number; } | null>(null);
  const [columnIdentifications, setColumnIdentifications] = React.useState<Record<number, ColumnIdentification>>({});

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

  const handleCompareWithRedis = async (column: number) => {
    try {
      const columnValues = parsedData.map(row => row[column]);
      const setKey = headers[column]; // Using header as the Redis set key

      const result = await compareColumnWithRedis(columnValues, setKey);

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`
      );

      console.log('Detailed results:', result);
    } catch (error) {
      toast.error('Failed to compare with Redis');
    }
  };

  const handleIdentifyColumn = async (column: number) => {
    try {
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map(row => row[column]);

      const identification = await identifyColumn(columnName, sampleValues);
      // setColumnIdentifications(prev => ({
      //   ...prev,
      //   [column]: identification
      // }));

      toast.success(
        <div>
          <p className="font-semibold">{identification.type}</p>
          <p className="text-sm text-muted-foreground">
            {identification.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Confidence: {Math.round(identification.confidence * 100)}%
          </p>
        </div>
      );
    } catch (error) {
      console.error("Error identifying column:", error);
      toast.error("Failed to identify column");
    }
  };

  const afterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    // Clear existing content
    while (TH.firstChild) {
      TH.removeChild(TH.firstChild);
    }
    // Create container div
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.width = '100%';

    // Add header text
    const headerText = document.createElement('span');
    headerText.textContent = headers[column] || '';
    headerText.style.flex = '1';
    headerText.style.cursor = 'pointer'; // Show it's clickable

    // Add menu button
    const menuButton = document.createElement('button');
    menuButton.textContent = '...';
    menuButton.className = 'px-2 py-1 text-xs bg-transparent hover:bg-gray-200 rounded';
    menuButton.addEventListener('mousedown', (e) => {
      e.stopImmediatePropagation();
    });
    menuButton.addEventListener('click', (e) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tableRect = TH.closest('.handsontable')?.getBoundingClientRect() ?? new DOMRect();
      setButtonRect({
        left: rect.left - tableRect.left,
        bottom: rect.bottom - tableRect.top,
      });
      setActiveColumn(column);
    });

    // Add type indicator if identified
    const identification = columnIdentifications[column];
    if (identification) {
      const typeIndicator = document.createElement('span');
      typeIndicator.textContent = identification.type;
      typeIndicator.className = 'text-xs text-muted-foreground ml-2';
      container.insertBefore(typeIndicator, menuButton);
    }

    // Append elements
    container.appendChild(headerText);
    container.appendChild(menuButton);
    TH.appendChild(container);
  };

  if (!parsedData.length) return <div>Loading...</div>;

  return (
    <div className="relative">
      <div className="mb-4">
        <Button onClick={toggleHeader} variant="ghost">
          {hasHeader ? "Disable Header Row" : "Enable Header Row"}
        </Button>
      </div>

      {activeColumn !== null && (
        <DropdownMenu open={true} onOpenChange={() => setActiveColumn(null)}>
          <DropdownMenuTrigger asChild>
            <div style={{
              position: 'absolute',
              visibility: 'hidden',
            }} />
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContentNoAnimation
              style={{
                position: 'fixed',
                top: '0px',
                left: '0px',
                transform: `translate(${buttonRect?.left ?? 0}px, ${buttonRect?.bottom ?? 0}px)`,
              }}
            >
              <DropdownMenuItem onClick={() => handleIdentifyColumn(activeColumn)}>
                Identify Column Type
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCompareWithRedis(activeColumn)}>
                Compare with Redis
              </DropdownMenuItem>
              {columnIdentifications[activeColumn]?.suggestedActions?.map((action, index) => (
                <DropdownMenuItem key={index} onClick={() => {
                  // TODO: Implement action handlers
                  toast.info(`Action "${action}" not implemented yet`);
                }}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContentNoAnimation>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}

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
        afterGetColHeader={afterGetColHeader}
      />
    </div>
  );
}
