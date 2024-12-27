/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/dist/handsontable.full.min.css";

import React from "react";

import { registerAllModules } from "handsontable/registry";
import { useRouter } from "next/navigation";
import PQueue from "p-queue";
import { toast } from "sonner";

import HotTable from "@handsontable/react";

import { compareColumnWithRedis } from "@/actions/compare-column";
import { identifyColumn } from "@/actions/identify-column";
import {
  IdentificationStatus,
  RedisStatus,
  Stats,
  TableStore,
  TableStoreAction,
  useTableStore,
} from "@/stores/table-store";
import {
  ACCEPTABLE_TYPES,
  ALL_ONTOLOGY_KEYS,
  COLUMN_TYPES,
} from "@/utils/column-types";
import { isValidNumber } from "@/utils/validation";

import { createCellRenderer } from "./table/cell-renderer";
import { PopoverState, renderHeader } from "./table/header-renderer";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// ------------
// Constants
// ------------

const AUTO_START = true;

// ------------
// HandsonTable
// ------------

registerAllModules();

// -----
// Types
// -----

interface CSVTableProps {
  hasHeader: boolean;
  headers: string[];
  parsedData: any[][];
}

// const openai = new OpenAI({
//   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true,
// });

// function isProteinColumn(header: string): boolean {
//   const proteinPatterns = [
//     /protein/i,
//     /prot[\s_-]?id/i,
//     /protein[\s_-]?identifier/i,
//   ];
//   return proteinPatterns.some((pattern) => pattern.test(header));
// }

// --------------
// Main component
// --------------

export default function CSVTable({
  hasHeader,
  headers,
  parsedData,
}: CSVTableProps) {
  // -----
  // State
  // -----

  const { state, dispatch, actions } = useTableStore();
  const router = useRouter();
  const hotRef = React.useRef<any>(null);
  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );
  const [didStartIdentification, setDidStartIdentification] =
    React.useState(false);

  // Reset state when data changes
  React.useEffect(() => {
    // Reset table store
    dispatch(actions.reset());
    // Reset identification state
    setDidStartIdentification(false);
  }, [parsedData, dispatch, actions]);

  // // bring back when handsontable is updated
  // const hasSystemDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  // const { theme } = useTheme();

  // // Function to force rerender of a header
  // const rerenderHeader = React.useCallback((column: number) => {
  //   if (hotRef.current?.hotInstance) {
  //     const hot = hotRef.current.hotInstance;
  //     // Rerender the specific column header
  //     hot.getPlugin("columnSorting").clearSort();
  //     hot
  //       .getSettings()
  //       .afterGetColHeader(
  //         column,
  //         hot.view._wt.wtTable.getColumnHeader(column)
  //       );
  //     hot.render();
  //   }
  // }, []);

  // // Function to force rerender of a cell
  // const rerenderCell = React.useCallback((row: number, column: number) => {
  //   if (hotRef.current?.hotInstance) {
  //     const hot = hotRef.current.hotInstance;
  //     // Rerender the specific cell
  //     hot.validateCell(
  //       hot.getDataAtCell(row, column),
  //       hot.getCellMeta(row, column),
  //       () => {}
  //     );
  //     hot.render();
  //   }
  // }, []);

  //   const handleDetectDisplayCode = async (columnIndex: number) => {
  //   const handleDetectDisplayCode = async (columnIndex: number) => {
  //     try {
  //       const columnName = headers[columnIndex];
  //       const firstFiveRows = parsedData
  //         .slice(0, 5)
  //         .map((row) => row[columnIndex]);

  //       const prompt = `Analyze this column of data:
  // Column name: ${columnName}
  // First 5 values: ${firstFiveRows.join(", ")}

  // Please provide a brief summary of what type of data this appears to be and any patterns you notice.`;

  //       // const completion = await openai.chat.completions.create({
  //       //   messages: [{ role: "user", content: prompt }],
  //       //   model: "gpt-3.5-turbo",
  //       // });

  //       // const summary = completion.choices[0]?.message?.content;
  //       // console.log(`Analysis for column "${columnName}":`);
  //       // console.log(summary);

  //       // TODO
  //       // https://github.com/TanStack/table/issues/3636

  //       toast.success("Analysis complete! Check the console for details.");
  //     } catch (error) {
  //       console.error("Error analyzing column:", error);
  //       toast.error("Failed to analyze column");
  //     }
  //   };

  // ------------
  // Handlers
  // ------------

  const handleToggleHeader = () => {
    dispatch(actions.toggleHeader());
  };

  const handleCompareWithRedis = async (
    column: number,
    ontologyKey: string
  ) => {
    const columnValues = parsedData.map((row) => row[column]);

    // Set column Redis status to MATCHING
    dispatch(actions.setRedisStatus(column, RedisStatus.MATCHING));

    try {
      const result = await compareColumnWithRedis(columnValues, ontologyKey);

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      // Set Redis data
      dispatch(actions.setRedisStatus(column, RedisStatus.MATCHED));
      dispatch(
        actions.setRedisData(column, {
          redisStatus: RedisStatus.MATCHED,
          matchData: {
            matches: result.matches.length,
            total: columnValues.length,
          },
          matches: new Set(result.matches),
          info: {
            link_prefix: result.info.link_prefix,
            description: result.info.description,
            num_entries: result.info.num_entries,
            link: result.info.link,
          },
        })
      );
    } catch (error) {
      console.error("Error comparing with Redis:", error);
      dispatch(actions.setRedisStatus(column, RedisStatus.ERROR));
    }
  };

  const handleIdentifyColumn = async (column: number) => {
    let ontologyKeyNeedsComparison: string | null = null;

    // update status
    dispatch(
      actions.setIdentificationStatus(column, IdentificationStatus.IDENTIFYING)
    );

    try {
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map((row) => row[column]);
      const identification = await identifyColumn(columnName, sampleValues);

      // done identifying
      dispatch(actions.setIdentification(column, identification));
      dispatch(
        actions.setIdentificationStatus(column, IdentificationStatus.IDENTIFIED)
      );

      if (ALL_ONTOLOGY_KEYS.includes(identification.type)) {
        ontologyKeyNeedsComparison = identification.type;
      }
    } catch (error) {
      console.error("Error identifying column:", error);
      dispatch(
        actions.setIdentificationStatus(column, IdentificationStatus.ERROR)
      );
    }

    // now compare with Redis
    if (ontologyKeyNeedsComparison) {
      await handleCompareWithRedis(column, ontologyKeyNeedsComparison);
    }
  };

  /**
   * Callback from handsontable to render the header
   */
  const afterGetColHeader = React.useCallback(
    (column: number, th: HTMLTableCellElement) => {
      if (!th) return;

      // Clear existing content
      while (th.firstChild) {
        th.removeChild(th.firstChild);
      }

      // Get column data for numeric validation
      const columnData = parsedData.map((row) => row[column]);

      renderHeader(
        th,
        column,
        headers,
        state.identificationStatus[column],
        state.redisStatus[column],
        state.identifications[column],
        state.redisMatchData[column],
        popoverState,
        setPopoverState,
        columnData
      );
    },
    [
      headers,
      state.identifications,
      state.identificationStatus,
      state.redisStatus,
      state.redisMatchData,
      popoverState,
      setPopoverState,
      parsedData,
    ]
  );

  // ------------
  // Effects
  // ------------

  // Function to calculate stats for a column
  const calculateColumnStats = React.useCallback((data: any[]): Stats => {
    const numbers = data
      .map((val) => (typeof val === "string" ? parseFloat(val) : val))
      .filter((num) => !isNaN(num));

    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
    };
  }, []);

  // Update column stats when column is identified as numeric
  React.useEffect(() => {
    Object.entries(state.identifications).forEach(([col, identification]) => {
      const colIndex = parseInt(col);
      if (
        (identification.type === "integer-numbers" ||
          identification.type === "decimal-numbers") &&
        !state.stats[colIndex]
      ) {
        const columnData = parsedData.map((row) => row[colIndex]);
        dispatch(actions.setStats(colIndex, calculateColumnStats(columnData)));
      }
    });
  }, [
    state.identifications,
    parsedData,
    calculateColumnStats,
    dispatch,
    actions,
  ]);

  // // Fix a bug where the theme class is not being applied by HotTable
  // const fixTheme = React.useCallback(() => {
  //   Array.from(document.getElementsByClassName("ht-wrapper")).forEach((el) => {
  //     el.classList.remove("ht-theme-main-dark");
  //     el.classList.remove("ht-theme-main");
  //     el.classList.add(
  //       theme === "dark" || (theme === "system" && hasSystemDarkMode)
  //         ? "ht-theme-main-dark"
  //         : "ht-theme-main"
  //     );
  //   });
  // }, [theme, hasSystemDarkMode]);
  // React.useEffect(() => {
  //   fixTheme();
  // }, [theme]);
  // React.useEffect(() => {
  //   fixTheme();
  // }, [hasSystemDarkMode]);
  // React.useEffect(() => {
  //   const timeout = setTimeout(fixTheme, 200);
  //   return () => clearTimeout(timeout);
  // }, []);

  // Add scroll handler
  React.useEffect(() => {
    const handleScroll = () => {
      if (popoverState) {
        setPopoverState(null);
      }
    };

    // HotTable adds its container after mounting
    const hotContainer = document.querySelector(".handsontable");
    if (hotContainer) {
      hotContainer.addEventListener("scroll", handleScroll);
    }

    // Also listen to window scroll
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      if (hotContainer) {
        hotContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [popoverState, setPopoverState]);

  // start identifying columns using p-queue when page loads
  const identificationQueue = new PQueue({ concurrency: 3 });
  React.useEffect(() => {
    if (!AUTO_START) return;
    if (!parsedData.length) return;
    if (didStartIdentification) return;
    setDidStartIdentification(true);

    // Queue all columns for identification
    parsedData[0]
      .map((_, i) => i)
      .filter((columnIndex) => !state.identifications[columnIndex])
      .forEach((columnIndex) => {
        identificationQueue.add(() => handleIdentifyColumn(columnIndex));
      });

    identificationQueue
      .onIdle()
      .then(() => {
        console.log("Identification queue finished");
      })
      .catch((error) => {
        console.error("Error identifying columns:", error);
      });
  }, [parsedData, state.identifications, handleIdentifyColumn]);

  // -------
  // Loading
  // -------

  if (!parsedData.length) return <div>Loading...</div>;

  // ------
  // Render
  // ------

  return (
    <div className="relative w-full">
      <div className="mb-4">
        <Button onClick={handleToggleHeader} variant="ghost">
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
              id="popover-trigger"
              style={{
                position: "fixed",
                left: popoverState.rect.left,
                top: popoverState.rect.top + 28,
              }}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-80"
            sideOffset={5}
            collisionPadding={20}
            side="bottom"
            align="start"
            onFocusOutside={(e) => {
              e.preventDefault();
            }}
          >
            {renderPopoverContent({
              state,
              dispatch,
              popoverState,
              parsedData,
              handleCompareWithRedis,
              handleIdentifyColumn,
              hotRef,
              headers,
              router,
            })}
          </PopoverContent>
        </Popover>
      )}

      <div className="h-[calc(100vh-130px)] overflow-hidden w-full fixed top-[130px] left-0">
        <HotTable
          ref={hotRef}
          data={parsedData}
          colHeaders={headers}
          rowHeaders={true}
          readOnly={true}
          columnHeaderHeight={42}
          contextMenu={["copy", "cut"]}
          licenseKey="non-commercial-and-evaluation"
          afterGetColHeader={afterGetColHeader}
          cells={(_, col: number) => ({
            renderer: createCellRenderer({
              identification: state.identifications[col],
              redisStatus: state.redisStatus[col],
              redisMatches: state.redisMatches[col],
              redisInfo: state.redisInfo[col],
              stats: state.stats[col],
            }),
          })}
        />
      </div>
    </div>
  );
}

function renderPopoverContent({
  state,
  dispatch,
  popoverState,
  parsedData,
  handleCompareWithRedis,
  handleIdentifyColumn,
  hotRef,
  headers,
  router,
}: {
  state: TableStore;
  dispatch: React.Dispatch<TableStoreAction>;
  popoverState: PopoverState;
  parsedData: any[][];
  handleCompareWithRedis: (column: number, type: string) => Promise<void>;
  handleIdentifyColumn: (column: number) => Promise<void>;
  hotRef: React.RefObject<any>;
  headers: string[];
  router: ReturnType<typeof useRouter>;
}) {
  const content = [];

  // Add identification info if available
  if (state.identifications[popoverState.column]) {
    content.push(
      <div key="info" className="space-y-2">
        <h4 className="font-medium">
          {state.identifications[popoverState.column].type}
        </h4>
        <p className="text-sm text-muted-foreground">
          {state.identifications[popoverState.column].description}
        </p>
      </div>
    );

    // Add status section with icon and stats
    content.push(
      <div key="status" className="space-y-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {/* TODO bring back the status icon (a) without dangerouslySetInnerHTML and (b) without regenerating the column data */}
          {/* <div
            dangerouslySetInnerHTML={{
              __html: createStatusIcon(
                state.identifications[popoverState.column].type,
                state.redisMatchData[popoverState.column],
                parsedData.map((row) => row[popoverState.column])
              ).html,
            }}
          /> */}
          <div className="text-sm">
            {(() => {
              const type = state.identifications[popoverState.column].type;
              const redisData = state.redisMatchData[popoverState.column];
              const columnData = parsedData.map(
                (row) => row[popoverState.column]
              );
              const stats = state.stats[popoverState.column];

              if (redisData?.matches && redisData.matches > 0) {
                return `${redisData.matches} of ${redisData.total} values found in Redis`;
              } else if (
                type === "integer-numbers" ||
                type === "decimal-numbers"
              ) {
                // TODO calculate this once and store in state
                const validValues = columnData.filter((value) =>
                  isValidNumber(value, type)
                );
                return `${validValues.length} of ${
                  columnData.length
                } values are valid ${
                  type === "integer-numbers" ? "integers" : "decimals"
                }`;
              } else if (type === "enum-values") {
                const nonEmptyValues = columnData.filter(
                  (value) =>
                    value !== null && value !== undefined && value !== ""
                );
                const uniqueValues = new Set(nonEmptyValues);
                return `${uniqueValues.size} unique values across ${nonEmptyValues.length} non-empty values`;
              } else if (ACCEPTABLE_TYPES.includes(type)) {
                return `Identified as ${type}`;
              } else {
                return `Unknown or unsupported type: ${type}`;
              }
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Add numeric bounds controls if numeric column
  const columnType = state.identifications[popoverState.column]?.type;
  if (columnType === "integer-numbers" || columnType === "decimal-numbers") {
    const stats = state.stats[popoverState.column];
    if (stats) {
      content.push(
        <div key="bounds" className="mt-4 space-y-2">
          <div className="text-sm font-medium">Absolute Bounds</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Min</label>
              <Input
                type="number"
                step={columnType === "integer-numbers" ? "1" : "any"}
                value={stats.absoluteMin ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? undefined
                      : columnType === "integer-numbers"
                      ? Math.round(Number(e.target.value))
                      : Number(e.target.value);
                  dispatch({
                    type: "setAbsoluteBounds",
                    column: popoverState.column,
                    min: value,
                    max: stats.absoluteMax,
                  });
                }}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max</label>
              <Input
                type="number"
                step={columnType === "integer-numbers" ? "1" : "any"}
                value={stats.absoluteMax ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === ""
                      ? undefined
                      : columnType === "integer-numbers"
                      ? Math.round(Number(e.target.value))
                      : Number(e.target.value);
                  dispatch({
                    type: "setAbsoluteBounds",
                    column: popoverState.column,
                    min: stats.absoluteMin,
                    max: value,
                  });
                }}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  // Add Redis match info if available
  if (
    state.redisMatchData[popoverState.column]?.matches > 0 &&
    state.redisStatus[popoverState.column] === RedisStatus.MATCHED
  ) {
    content.push(
      <div key="redis" className="space-y-2">
        <div className="text-sm font-medium">Resource Information</div>
        <div className="text-sm text-muted-foreground">
          {`${state.redisMatchData[popoverState.column].matches} out of ${
            state.redisMatchData[popoverState.column].total
          } values found`}
        </div>
        {state.redisInfo[popoverState.column]?.link && (
          <a
            href={state.redisInfo[popoverState.column].link}
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Current identification info */}
      {state.identifications[popoverState.column] && (
        <>
          <div className="space-y-2">
            <h4 className="font-medium">
              {state.identifications[popoverState.column].type}
            </h4>
            <p className="text-sm text-muted-foreground">
              {state.identifications[popoverState.column].description}
            </p>
          </div>

          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {/* TODO bring back the status icon (a) without dangerouslySetInnerHTML and (b) without regenerating the column data */}
              {/* <div
                dangerouslySetInnerHTML={{
                  __html: createStatusIcon(
                    state.identifications[popoverState.column].type,
                    state.redisMatchData[popoverState.column],
                    parsedData.map((row) => row[popoverState.column])
                  ).html,
                }}
              /> */}
              <div className="text-sm">
                {(() => {
                  const type = state.identifications[popoverState.column].type;
                  const redisData = state.redisMatchData[popoverState.column];
                  const columnData = parsedData.map(
                    (row) => row[popoverState.column]
                  );

                  if (redisData?.matches && redisData.matches > 0) {
                    return `${redisData.matches} of ${redisData.total} values found in Redis`;
                  } else if (
                    type === "integer-numbers" ||
                    type === "decimal-numbers"
                  ) {
                    const validValues = columnData.filter((value) =>
                      isValidNumber(value, type)
                    );
                    return `${validValues.length} of ${
                      columnData.length
                    } values are valid ${
                      type === "integer-numbers" ? "integers" : "decimals"
                    }`;
                  } else if (type === "enum-values") {
                    const nonEmptyValues = columnData.filter(
                      (value) =>
                        value !== null && value !== undefined && value !== ""
                    );
                    const uniqueValues = new Set(nonEmptyValues);
                    return `${uniqueValues.size} unique values across ${nonEmptyValues.length} non-empty values`;
                  } else if (ACCEPTABLE_TYPES.includes(type)) {
                    return `Identified as ${type}`;
                  } else {
                    return `Unknown or unsupported type: ${type}`;
                  }
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Type selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Manual Type Selection</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled={
                state.redisStatus[popoverState.column] ===
                  RedisStatus.MATCHING ||
                state.identificationStatus[popoverState.column] ===
                  IdentificationStatus.IDENTIFYING
              }
            >
              {state.identifications[popoverState.column]?.type ||
                "Select a type..."}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuRadioGroup
              value={state.identifications[popoverState.column]?.type || ""}
              onValueChange={async (value) => {
                // Update column identification
                dispatch({
                  type: "setIdentification",
                  column: popoverState.column,
                  identification: {
                    type: value,
                    description: `Manually set as ${value}`,
                  },
                });
                dispatch({
                  type: "setIdentificationStatus",
                  column: popoverState.column,
                  status: IdentificationStatus.IDENTIFIED,
                });

                // If the selected type has an ontology key, start Redis comparison
                if (ALL_ONTOLOGY_KEYS.includes(value)) {
                  await handleCompareWithRedis(popoverState.column, value);
                }
              }}
            >
              {COLUMN_TYPES.map((type) => (
                <DropdownMenuRadioItem key={type.name} value={type.name}>
                  <div className="flex items-center justify-between w-full">
                    <span>{type.name}</span>
                    {type.is_custom && (
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Absolute bounds controls for numeric columns */}
      {columnType === "integer-numbers" || columnType === "decimal-numbers" ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Absolute Bounds</div>
          {state.stats[popoverState.column] && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Min</label>
                <Input
                  type="number"
                  step={columnType === "integer-numbers" ? "1" : "any"}
                  value={state.stats[popoverState.column].absoluteMin ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : columnType === "integer-numbers"
                        ? Math.round(Number(e.target.value))
                        : Number(e.target.value);
                    dispatch({
                      type: "setAbsoluteBounds",
                      column: popoverState.column,
                      min: value,
                      max: state.stats[popoverState.column].absoluteMax,
                    });
                    // Force re-render of all cells in the column
                    if (hotRef.current?.hotInstance) {
                      hotRef.current.hotInstance.render();
                    }
                  }}
                  placeholder={state.stats[popoverState.column].min.toString()}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max</label>
                <Input
                  type="number"
                  step={columnType === "integer-numbers" ? "1" : "any"}
                  value={state.stats[popoverState.column].absoluteMax ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : columnType === "integer-numbers"
                        ? Math.round(Number(e.target.value))
                        : Number(e.target.value);
                    dispatch({
                      type: "setAbsoluteBounds",
                      column: popoverState.column,
                      min: state.stats[popoverState.column].absoluteMin,
                      max: value,
                    });
                    // Force re-render of all cells in the column
                    if (hotRef.current?.hotInstance) {
                      hotRef.current.hotInstance.render();
                    }
                  }}
                  placeholder={state.stats[popoverState.column].max.toString()}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Redis match info */}
      {state.redisMatchData[popoverState.column]?.matches > 0 &&
        state.redisStatus[popoverState.column] === RedisStatus.MATCHED && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Resource Information</div>
            <div className="text-sm text-muted-foreground">
              {`${state.redisMatchData[popoverState.column].matches} out of ${
                state.redisMatchData[popoverState.column].total
              } values found`}
            </div>
            {state.redisInfo[popoverState.column]?.link && (
              <a
                href={state.redisInfo[popoverState.column].link}
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

      {/* Add new type button */}
      <Button
        onClick={() => {
          // Store the current column info in localStorage
          const columnInfo = {
            columnIndex: popoverState.column,
            columnName: headers[popoverState.column],
            sampleValues: parsedData
              .slice(0, 10)
              .map((row) => row[popoverState.column]),
            returnUrl: window.location.pathname + window.location.search,
          };
          localStorage.setItem(
            "custom_type_context",
            JSON.stringify(columnInfo)
          );
          router.push("/custom-type/new");
        }}
        variant="outline"
        className="w-full mb-2"
      >
        Create a new type for this column
      </Button>

      {/* Identify button */}
      <Button
        onClick={() => handleIdentifyColumn(popoverState.column)}
        variant="secondary"
        className="w-full"
        disabled={
          state.identificationStatus[popoverState.column] ===
            IdentificationStatus.IDENTIFYING ||
          state.redisStatus[popoverState.column] === RedisStatus.MATCHING
        }
      >
        Identify column type
      </Button>
    </div>
  );
}
