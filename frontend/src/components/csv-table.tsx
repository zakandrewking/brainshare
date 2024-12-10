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
import { ColumnIdentification, identifyColumn } from "@/actions/identify-column";
import { useAsyncEffect } from "@/hooks/use-async-effect";

import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

registerAllModules();

interface CSVTableProps {
  url: string;
}

interface ResourceInfo {
  description: string;
  link: string;
  link_prefix: string;
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

interface PopoverState {
  column: number;
  rect: { left: number; bottom: number };
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
  const [buttonRect, setButtonRect] = React.useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [columnIdentifications, setColumnIdentifications] = React.useState<
    Record<number, ColumnIdentification>
  >({});

  /**
   * Tracks the Redis match status for each column after type identification.
   * Key: Column index
   * TODO what if we are allowing column reordering?
   * Value: Object containing:
   *   - matches: Number of values found in Redis
   *   - total: Total number of values in the column
   */
  const [columnRedisStatus, setColumnRedisStatus] = React.useState<
    Record<number, { matches: number; total: number }>
  >({});

  const [columnRedisMatches, setColumnRedisMatches] = React.useState<
    Record<number, Set<string>>
  >({});
  const [columnRedisInfo, setColumnRedisInfo] = React.useState<
    Record<number, { link_prefix?: string }>
  >({});

  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );

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

  const handleIdentifyColumn = async (column: number) => {
    try {
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map((row) => row[column]);

      const identification = await identifyColumn(columnName, sampleValues);
      setColumnIdentifications((prev) => ({
        ...prev,
        [column]: identification,
      }));

      // After identifying the column, check Redis if it's a known type
      if (identification.type !== "unknown") {
        const columnValues = parsedData.map((row) => row[column]);
        const redisResult = await compareColumnWithRedis(
          columnValues,
          identification.type
        );
        setColumnRedisStatus((prev) => ({
          ...prev,
          [column]: {
            matches: redisResult.matches.length,
            total: columnValues.length,
          },
        }));
        // Store the actual matching values for cell styling
        setColumnRedisMatches((prev) => ({
          ...prev,
          [column]: new Set(redisResult.matches),
        }));
        // Store the resource info for link generation
        setColumnRedisInfo((prev) => ({
          ...prev,
          [column]: redisResult.info,
        }));
      }

      toast.success(
        <div>
          <p className="font-semibold">{identification.type}</p>
          <p className="text-sm text-muted-foreground">
            {identification.description}
          </p>
        </div>
      );
    } catch (error) {
      console.error("Error identifying column:", error);
      toast.error("Failed to identify column");
    }
  };

  const handleCompareWithRedis = async (column: number) => {
    try {
      const columnValues = parsedData.map((row) => row[column]);
      const setKey = headers[column]; // Using header as the Redis set key

      const result = await compareColumnWithRedis(columnValues, setKey);

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      console.log("Detailed results:", result);
    } catch (error) {
      toast.error("Failed to compare with Redis");
    }
  };

  const afterGetColHeader = (column: number, TH: HTMLTableCellElement) => {
    // Clear existing content
    while (TH.firstChild) {
      TH.removeChild(TH.firstChild);
    }
    // Create container div
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "8px";
    container.style.width = "100%";

    // Add header text
    const headerText = document.createElement("span");
    headerText.textContent = headers[column] || "";
    headerText.style.flex = "1";
    headerText.style.cursor = "pointer"; // Show it's clickable

    // Add Redis status icon if available
    if (columnRedisStatus[column]) {
      const statusIcon = document.createElement("span");
      const { matches, total } = columnRedisStatus[column];
      if (matches > 0) {
        statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>`;
        statusIcon.title = `${matches} out of ${total} values found in Redis`;
      } else {
        statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        statusIcon.title = `No values found in Redis`;
      }
      container.appendChild(statusIcon);
    }

    // Add menu button
    const menuButton = document.createElement("button");
    menuButton.textContent = "...";
    menuButton.className =
      "px-2 py-1 text-xs bg-transparent hover:bg-gray-200 rounded";
    menuButton.addEventListener("pointerdown", (e) => {
      // capture the pointer event before it reaches onPointerDownOutside in
      // PopoverContent
      e.stopPropagation();
    });
    menuButton.addEventListener("mousedown", (e) => {
      // capture the mouse event before it reaches the table
      e.stopPropagation();
    });
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const tableRect =
        TH.closest(".handsontable")?.getBoundingClientRect() ?? new DOMRect();

      // If clicking the same column, close it
      if (popoverState?.column === column) {
        setPopoverState(null);
        return;
      }

      // Update position and column
      setPopoverState({
        column,
        rect: {
          left: rect.left - tableRect.left,
          bottom: rect.bottom - tableRect.top,
        },
      });
    });

    container.appendChild(headerText);
    container.appendChild(menuButton);
    TH.appendChild(container);
  };

  // Add cell renderer function for Redis match indicators
  const cellRenderer = (
    instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: any,
    value: any,
    cellProperties: any
  ) => {
    // Only add indicators and links for columns that have Redis matches
    if (columnRedisStatus[col]?.matches > 0) {
      const isMatch = columnRedisMatches[col]?.has(value);
      const linkPrefix = columnRedisInfo[col]?.link_prefix;

      if (isMatch && linkPrefix) {
        // Create container for link and icon
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "4px";

        // Create link wrapper
        const link = document.createElement("a");
        link.href = `${linkPrefix}${value}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.color = "inherit";
        link.style.textDecoration = "underline";
        link.style.textDecorationColor = "currentColor";
        link.style.textUnderlineOffset = "2px";
        link.innerHTML = value;

        // Create link-out icon
        const icon = document.createElement("span");
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
        icon.style.display = "inline-flex";

        // Add link and icon to container
        container.appendChild(link);
        container.appendChild(icon);

        // Clear existing content and add container
        td.innerHTML = "";
        td.appendChild(container);
      } else {
        td.innerHTML = value;
      }

      td.style.position = "relative";

      // Remove any existing indicator
      const existingIndicator = td.querySelector(".redis-match-indicator");
      if (existingIndicator) {
        existingIndicator.remove();
      }

      // Create indicator element
      const indicator = document.createElement("div");
      indicator.className = "redis-match-indicator";
      indicator.style.position = "absolute";
      indicator.style.right = "0";
      indicator.style.top = "0";
      indicator.style.bottom = "0";
      indicator.style.width = "3px";
      indicator.style.backgroundColor = isMatch
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(239, 68, 68, 0.2)";

      td.appendChild(indicator);
    } else {
      td.innerHTML = value;
    }

    return td;
  };

  if (!parsedData.length) return <div>Loading...</div>;

  return (
    <div className="relative">
      <div className="mb-4">
        <Button onClick={toggleHeader} variant="ghost">
          {hasHeader ? "Disable Header Row" : "Enable Header Row"}
        </Button>
      </div>

      {popoverState && (
        <Popover
          key={popoverState.column}
          defaultOpen={true}
          onOpenChange={(open) => !open && setPopoverState(null)}
        >
          <PopoverTrigger asChild>
            <div
              style={{
                position: "absolute",
                visibility: "hidden",
              }}
            />
          </PopoverTrigger>
          <PopoverContent
            style={{
              position: "fixed",
              top: "0px",
              left: "0px",
              transform: `translate(${popoverState.rect.left}px, ${popoverState.rect.bottom}px)`,
            }}
            className="w-80 [&[data-state=open]]:animate-none [&[data-state=closed]]:animate-none"
            sideOffset={0}
            collisionPadding={20}
            onFocusOutside={(e) => {
              // This is hard to prevent in external components, so we'll just
              // disabled the feature
              e.preventDefault();
            }}
          >
            <div className="space-y-4">
              {columnIdentifications[popoverState.column] && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {columnIdentifications[popoverState.column].type}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {columnIdentifications[popoverState.column].description}
                  </p>
                </div>
              )}

              {columnRedisStatus[popoverState.column]?.matches > 0 &&
                columnRedisInfo[popoverState.column] && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Resource Information
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {`${
                        columnRedisStatus[popoverState.column].matches
                      } out of ${
                        columnRedisStatus[popoverState.column].total
                      } values found`}
                    </div>
                    {columnRedisInfo[popoverState.column].link_prefix && (
                      <a
                        href={columnRedisInfo[popoverState.column].link_prefix}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                        View Resource
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    )}
                  </div>
                )}

              <Button
                onClick={() => handleIdentifyColumn(popoverState.column)}
                variant="secondary"
                className="w-full"
              >
                Identify column type
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
        cells={(row: number, col: number) => ({
          renderer: cellRenderer,
        })}
      />
    </div>
  );
}
