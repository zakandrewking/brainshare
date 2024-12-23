/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

import React from "react";

import { registerAllModules } from "handsontable/registry";
import { useTheme } from "next-themes";
import PQueue from "p-queue";
import * as R from "remeda";
import { toast } from "sonner";

import HotTable from "@handsontable/react-wrapper";

import { compareColumnWithRedis } from "@/actions/compare-column";
import { identifyColumn } from "@/actions/identify-column";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  ColumnIdentificationStatus,
  ColumnRedisStatus,
  ColumnStats,
  useTableStore,
} from "@/stores/table-store";
import {
  ALL_ONTOLOGY_KEYS,
  COLUMN_TYPES,
} from "@/utils/column-types";

import { createCellRenderer } from "./table/cell-renderer";
import {
  PopoverState,
  renderHeader,
} from "./table/header-renderer";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

// ------------
// Constants
// ------------

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

function isProteinColumn(header: string): boolean {
  const proteinPatterns = [
    /protein/i,
    /prot[\s_-]?id/i,
    /protein[\s_-]?identifier/i,
  ];
  return proteinPatterns.some((pattern) => pattern.test(header));
}

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

  const { theme } = useTheme();
  const hasSystemDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { state, dispatch } = useTableStore();
  const hotRef = React.useRef<any>(null);

  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );

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

  const [identifyingColumns, setIdentifyingColumns] = React.useState<
    Set<number>
  >(new Set());

  const [didStartIdentification, setDidStartIdentification] =
    React.useState(false);

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
    dispatch({ type: "toggleHeader" });
  };

  const handleCompareWithRedis = async (
    column: number,
    ontologyKey: string
  ) => {
    const columnValues = parsedData.map((row) => row[column]);

    // Set column Redis status to MATCHING
    dispatch({
      type: "setState",
      payload: {
        columnRedisStatus: {
          ...state.columnRedisStatus,
          [column]: ColumnRedisStatus.MATCHING,
        },
      },
    });

    try {
      const result = await compareColumnWithRedis(columnValues, ontologyKey);

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      // Set column Redis status to MATCHED
      dispatch({
        type: "setState",
        payload: {
          columnRedisStatus: {
            ...state.columnRedisStatus,
            [column]: ColumnRedisStatus.MATCHED,
          },
          columnRedisMatchData: {
            ...state.columnRedisMatchData,
            [column]: {
              matches: result.matches.length,
              total: columnValues.length,
            },
          },
          columnRedisMatches: {
            ...state.columnRedisMatches,
            [column]: new Set(result.matches),
          },
          columnRedisInfo: {
            ...state.columnRedisInfo,
            [column]: {
              link_prefix: result.info.link_prefix,
              description: result.info.description,
              num_entries: result.info.num_entries,
              link: result.info.link,
            },
          },
        },
      });

      // Force rerender of the header to show Redis status
      // rerenderHeader(column);
    } catch (error) {
      console.error("Error comparing with Redis:", error);
      dispatch({
        type: "setState",
        payload: {
          columnRedisStatus: {
            ...state.columnRedisStatus,
            [column]: ColumnRedisStatus.ERROR,
          },
        },
      });
    }
  };

  const handleIdentifyColumn = async (column: number) => {
    let ontologyKeyNeedsComparison: string | null = null;

    // update status
    dispatch({
      // reset column identification
      type: "setState",
      payload: {
        columnIdentifications: R.omit(state.columnIdentifications, [column]),
        columnIdentificationStatus: {
          ...state.columnIdentificationStatus,
          [column]: ColumnIdentificationStatus.IDENTIFYING,
        },
      },
    });

    try {
      setIdentifyingColumns((prev) => new Set(prev).add(column));
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map((row) => row[column]);
      const identification = await identifyColumn(columnName, sampleValues);

      // done identifying
      dispatch({
        type: "setState",
        payload: {
          columnIdentifications: {
            ...state.columnIdentifications,
            [column]: identification,
          },
          columnIdentificationStatus: {
            ...state.columnIdentificationStatus,
            [column]: ColumnIdentificationStatus.IDENTIFIED,
          },
        },
      });

      // Force rerender of the header to show the new status
      // rerenderHeader(column);

      if (ALL_ONTOLOGY_KEYS.includes(identification.type)) {
        ontologyKeyNeedsComparison = identification.type;
      }
    } catch (error) {
      console.error("Error identifying column:", error);
      dispatch({
        type: "setState",
        payload: {
          columnIdentificationStatus: {
            ...state.columnIdentificationStatus,
            [column]: ColumnIdentificationStatus.ERROR,
          },
        },
      });
      // Force rerender of the header to show the error status
      // rerenderHeader(column);
    } finally {
      setIdentifyingColumns((prev) => {
        const next = new Set(prev);
        next.delete(column);
        return next;
      });
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

      renderHeader(
        th,
        column,
        headers,
        state.columnIdentificationStatus[column],
        state.columnRedisStatus[column],
        state.columnIdentifications[column],
        state.columnRedisMatchData[column],
        popoverState,
        setPopoverState
      );
    },
    [
      headers,
      state.columnIdentifications,
      state.columnIdentificationStatus,
      state.columnRedisStatus,
      state.columnRedisMatchData,
      popoverState,
      setPopoverState,
    ]
  );

  // ------------
  // Effects
  // ------------

  // Function to calculate stats for a column
  const calculateColumnStats = React.useCallback((data: any[]): ColumnStats => {
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
    Object.entries(state.columnIdentifications).forEach(
      ([col, identification]) => {
        const colIndex = parseInt(col);
        if (
          (identification.type === "integer-numbers" ||
            identification.type === "decimal-numbers") &&
          !state.columnStats[colIndex]
        ) {
          const columnData = parsedData.map((row) => row[colIndex]);
          dispatch({
            type: "setState",
            payload: {
              columnStats: {
                ...state.columnStats,
                [colIndex]: calculateColumnStats(columnData),
              },
            },
          });
        }
      }
    );
  }, [state.columnIdentifications, parsedData, calculateColumnStats, dispatch]);

  // Fix a bug where the theme class is not being applied by HotTable
  const fixTheme = React.useCallback(() => {
    Array.from(document.getElementsByClassName("ht-wrapper")).forEach((el) => {
      el.classList.remove("ht-theme-main-dark");
      el.classList.remove("ht-theme-main");
      el.classList.add(
        theme === "dark" || (theme === "system" && hasSystemDarkMode)
          ? "ht-theme-main-dark"
          : "ht-theme-main"
      );
    });
  }, [theme, hasSystemDarkMode]);
  React.useEffect(() => {
    fixTheme();
  }, [theme]);
  React.useEffect(() => {
    fixTheme();
  }, [hasSystemDarkMode]);
  React.useEffect(() => {
    const timeout = setTimeout(fixTheme, 200);
    return () => clearTimeout(timeout);
  }, []);

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
    if (!parsedData.length) return;

    if (didStartIdentification) return;
    setDidStartIdentification(true);

    parsedData[0]
      .map((_, i) => i)
      .slice(3, 4)
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
  }, [parsedData]);

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
              // This is hard to prevent in external components, so we'll just
              // disable the feature
              e.preventDefault();
            }}
          >
            <div className="space-y-4">
              {state.columnIdentifications[popoverState.column] && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {state.columnIdentifications[popoverState.column].type}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {
                      state.columnIdentifications[popoverState.column]
                        .description
                    }
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Manual Type Selection
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={
                        state.columnRedisStatus[popoverState.column] ===
                          ColumnRedisStatus.MATCHING ||
                        state.columnIdentificationStatus[
                          popoverState.column
                        ] === ColumnIdentificationStatus.IDENTIFYING
                      }
                    >
                      {state.columnIdentifications[popoverState.column]?.type ||
                        "Select a type..."}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuRadioGroup
                      value={
                        state.columnIdentifications[popoverState.column]
                          ?.type || ""
                      }
                      onValueChange={async (value) => {
                        // Update column identification
                        dispatch({
                          type: "setState",
                          payload: {
                            columnIdentifications: {
                              ...state.columnIdentifications,
                              [popoverState.column]: {
                                type: value,
                                description: `Manually set as ${value}`,
                              },
                            },
                            columnIdentificationStatus: {
                              ...state.columnIdentificationStatus,
                              [popoverState.column]:
                                ColumnIdentificationStatus.IDENTIFIED,
                            },
                          },
                        });

                        // If the selected type has an ontology key, start Redis comparison
                        if (ALL_ONTOLOGY_KEYS.includes(value)) {
                          await handleCompareWithRedis(
                            popoverState.column,
                            value
                          );
                        }
                      }}
                    >
                      {COLUMN_TYPES.map((type) => (
                        <DropdownMenuRadioItem
                          key={type.name}
                          value={type.name}
                        >
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

              {state.columnRedisMatchData[popoverState.column]?.matches > 0 &&
                state.columnRedisStatus[popoverState.column] ===
                  ColumnRedisStatus.MATCHED && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Resource Information
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {`${
                        state.columnRedisMatchData[popoverState.column].matches
                      } out of ${
                        state.columnRedisMatchData[popoverState.column].total
                      } values found`}
                    </div>
                    {state.columnRedisInfo[popoverState.column]?.link && (
                      <a
                        href={state.columnRedisInfo[popoverState.column].link}
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
                disabled={
                  state.columnIdentificationStatus[popoverState.column] ===
                    ColumnIdentificationStatus.IDENTIFYING ||
                  state.columnRedisStatus[popoverState.column] ===
                    ColumnRedisStatus.MATCHING
                }
              >
                Identify column type
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="h-[calc(100vh-160px)] overflow-hidden w-full fixed top-[160px] left-0">
        <HotTable
          ref={hotRef}
          // themeName={theme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"}
          data={parsedData}
          colHeaders={headers}
          rowHeaders={true}
          readOnly={true}
          columnHeaderHeight={42}
          contextMenu={["copy", "cut"]}
          licenseKey="non-commercial-and-evaluation"
          afterGetColHeader={afterGetColHeader}
          cells={(row: number, col: number) => ({
            renderer: createCellRenderer({
              columnIdentification: state.columnIdentifications[col],
              columnRedisStatus: state.columnRedisStatus[col],
              columnRedisMatches: state.columnRedisMatches[col],
              columnRedisInfo: state.columnRedisInfo[col],
              columnStats: state.columnStats[col],
            }),
          })}
        />
      </div>
    </div>
  );
}
