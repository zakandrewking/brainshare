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
import { loadTableIdentifications } from "@/actions/table-identification";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import {
  IdentificationStatus,
  RedisStatus,
  type Stats,
  type TableStoreState,
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
import { Switch } from "./ui/switch";

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
  prefixedId: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

// --------------
// Main component
// --------------

export default function CSVTable({
  hasHeader,
  headers,
  parsedData,
  prefixedId,
  onLoadingChange,
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
  const [isLoadingIdentifications, setIsLoadingIdentifications] =
    React.useState(true);

  // request queue state
  const identificationQueue = React.useRef(new PQueue({ concurrency: 3 }));
  const abortController = React.useRef(new AbortController());

  // ------------
  // Handlers
  // ------------

  const handleToggleHeader = () => {
    dispatch(actions.toggleHeader());
  };

  const handleCompareWithRedis = async (
    column: number,
    ontologyKey: string,
    signal: AbortSignal
  ) => {
    const columnValues = parsedData.map((row) => row[column]);

    // Set column Redis status to MATCHING
    dispatch(actions.setRedisStatus(column, RedisStatus.MATCHING));

    try {
      const result = await compareColumnWithRedis(columnValues, ontologyKey);

      // If aborted, don't update state
      if (signal.aborted) return;

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
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("Error comparing with Redis:", error);
      dispatch(actions.setRedisStatus(column, RedisStatus.ERROR));
    }
  };

  const handleIdentifyColumn = async (column: number, signal: AbortSignal) => {
    let ontologyKeyNeedsComparison: string | null = null;

    // update status
    dispatch(
      actions.setIdentificationStatus(column, IdentificationStatus.IDENTIFYING)
    );

    try {
      const columnName = headers[column];
      const sampleValues = parsedData.slice(0, 10).map((row) => row[column]);
      const identification = await identifyColumn(columnName, sampleValues);

      // If aborted, don't update state
      if (signal.aborted) return;

      // done identifying
      dispatch(actions.setIdentification(column, identification));
      dispatch(
        actions.setIdentificationStatus(column, IdentificationStatus.IDENTIFIED)
      );

      if (ALL_ONTOLOGY_KEYS.includes(identification.type)) {
        ontologyKeyNeedsComparison = identification.type;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("Error identifying column:", error);
      dispatch(
        actions.setIdentificationStatus(column, IdentificationStatus.ERROR)
      );
    }

    // now compare with Redis
    if (ontologyKeyNeedsComparison && !signal.aborted) {
      await handleCompareWithRedis(column, ontologyKeyNeedsComparison, signal);
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

  // ------------
  // Effects
  // ------------

  React.useEffect(() => {
    onLoadingChange?.(isLoadingIdentifications);
  }, [isLoadingIdentifications]);

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

  // Reset state when we unmount
  React.useEffect(() => {
    // cleanup function
    return () => {
      console.log("unmounting / resetting");
      abortController.current.abort("Unmounting");
      abortController.current = new AbortController();
      identificationQueue.current.clear();
      dispatch(actions.reset());
      setDidStartIdentification(false);
    };
  }, []);

  // reset state when we get a new file
  React.useEffect(() => {
    dispatch(actions.reset());
    dispatch(actions.setPrefixedId(prefixedId));
  }, [prefixedId]);

  // Load identifications and maybe auto-identify columns
  useAsyncEffect(
    async () => {
      if (!parsedData.length) return;

      setIsLoadingIdentifications(true);
      let existingIdentifications: TableStoreState | null = null;

      // Try to load existing identifications
      try {
        existingIdentifications = await loadTableIdentifications(prefixedId);
      } catch (error) {
        console.error("Error loading identifications:", error);
      } finally {
        setIsLoadingIdentifications(false);
      }

      if (existingIdentifications) {
        Object.entries(existingIdentifications.identifications).forEach(
          ([column, identification]) => {
            dispatch(actions.setIdentification(Number(column), identification));
            dispatch(
              actions.setIdentificationStatus(
                Number(column),
                IdentificationStatus.IDENTIFIED
              )
            );
          }
        );
        Object.entries(existingIdentifications.redisStatus).forEach(
          ([column, status]) => {
            dispatch(
              actions.setRedisStatus(Number(column), status as RedisStatus)
            );
          }
        );
        Object.entries(existingIdentifications.redisMatchData).forEach(
          ([column, data]) => {
            dispatch(
              actions.setRedisData(Number(column), {
                redisStatus: existingIdentifications.redisStatus[
                  Number(column)
                ] as RedisStatus,
                matchData: data as { matches: number; total: number },
                matches: existingIdentifications.redisMatches[Number(column)],
                info: existingIdentifications.redisInfo[Number(column)],
              })
            );
          }
        );
        Object.entries(existingIdentifications.stats).forEach(
          ([column, stats]) => {
            dispatch(actions.setStats(Number(column), stats as Stats));
          }
        );
      }

      // No existing identifications, start auto-identification if enabled
      if (!AUTO_START || didStartIdentification || existingIdentifications) {
        return;
      }
      setDidStartIdentification(true);

      // Queue all columns for identification
      parsedData[0]
        .map((_, i) => i)
        .filter((columnIndex) => !state.identifications[columnIndex])
        .forEach((columnIndex) => {
          identificationQueue.current.add(
            async ({ signal }) => {
              try {
                await handleIdentifyColumn(columnIndex, signal!);
              } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                  // Ignore abort errors
                  return;
                }
                throw error;
              }
            },
            { signal: abortController.current.signal }
          );
        });

      identificationQueue.current
        .onIdle()
        .then(() => {
          console.log("Identification queue finished");
        })
        .catch((error) => {
          if (!(error instanceof DOMException)) {
            console.error("Error identifying columns:", error);
          }
        });
    },
    async () => {},
    [parsedData]
  );

  // -------
  // Loading
  // -------

  if (!parsedData.length) return;

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
            className="w-80 p-0"
            sideOffset={5}
            collisionPadding={20}
            side="bottom"
            align="start"
            onFocusOutside={(e) => {
              e.preventDefault();
            }}
          >
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
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
                      <div className="text-sm">
                        {(() => {
                          const type =
                            state.identifications[popoverState.column].type;
                          const redisData =
                            state.redisMatchData[popoverState.column];
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
                              type === "integer-numbers"
                                ? "integers"
                                : "decimals"
                            }`;
                          } else if (type === "enum-values") {
                            const nonEmptyValues = columnData.filter(
                              (value) =>
                                value !== null &&
                                value !== undefined &&
                                value !== ""
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
                <label className="text-sm font-medium">
                  Manual Type Selection
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={
                        isLoadingIdentifications ||
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
                      value={
                        state.identifications[popoverState.column]?.type || ""
                      }
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
                          const controller = new AbortController();
                          await handleCompareWithRedis(
                            popoverState.column,
                            value,
                            controller.signal
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

              {/* Absolute bounds controls for numeric columns */}
              {state.identifications[popoverState.column]?.type ===
                "integer-numbers" ||
              state.identifications[popoverState.column]?.type ===
                "decimal-numbers" ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Absolute Bounds</div>
                  {state.stats[popoverState.column] && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Min
                          </label>
                          <Input
                            type="number"
                            step={
                              state.identifications[popoverState.column]
                                ?.type === "integer-numbers"
                                ? "1"
                                : "any"
                            }
                            value={
                              state.stats[popoverState.column].absoluteMin ?? ""
                            }
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? undefined
                                  : state.identifications[popoverState.column]
                                      ?.type === "integer-numbers"
                                  ? Math.round(Number(e.target.value))
                                  : Number(e.target.value);
                              dispatch({
                                type: "setAbsoluteBounds",
                                column: popoverState.column,
                                min: value,
                                max: state.stats[popoverState.column]
                                  .absoluteMax,
                              });
                              // Force re-render of all cells in the column
                              if (hotRef.current?.hotInstance) {
                                hotRef.current.hotInstance.render();
                              }
                            }}
                            placeholder={state.stats[
                              popoverState.column
                            ].min.toString()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Max
                          </label>
                          <Input
                            type="number"
                            step={
                              state.identifications[popoverState.column]
                                ?.type === "integer-numbers"
                                ? "1"
                                : "any"
                            }
                            value={
                              state.stats[popoverState.column].absoluteMax ?? ""
                            }
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? undefined
                                  : state.identifications[popoverState.column]
                                      ?.type === "integer-numbers"
                                  ? Math.round(Number(e.target.value))
                                  : Number(e.target.value);
                              dispatch({
                                type: "setAbsoluteBounds",
                                column: popoverState.column,
                                min: state.stats[popoverState.column]
                                  .absoluteMin,
                                max: value,
                              });
                              // Force re-render of all cells in the column
                              if (hotRef.current?.hotInstance) {
                                hotRef.current.hotInstance.render();
                              }
                            }}
                            placeholder={state.stats[
                              popoverState.column
                            ].max.toString()}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={
                            state.stats[popoverState.column].isLogarithmic ??
                            false
                          }
                          onCheckedChange={(checked) => {
                            dispatch({
                              type: "setLogarithmic",
                              column: popoverState.column,
                              isLogarithmic: checked,
                            });
                            // Force re-render of all cells in the column
                            if (hotRef.current?.hotInstance) {
                              hotRef.current.hotInstance.render();
                            }
                          }}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Use logarithmic scale
                        </label>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {/* Redis match info */}
              {state.redisMatchData[popoverState.column]?.matches > 0 &&
                state.redisStatus[popoverState.column] ===
                  RedisStatus.MATCHED && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Resource Information
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {`${
                        state.redisMatchData[popoverState.column].matches
                      } out of ${
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

              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    // Store the current column info in localStorage
                    const columnInfo = {
                      columnIndex: popoverState.column,
                      columnName: headers[popoverState.column],
                      sampleValues: parsedData
                        .slice(0, 10)
                        .map((row) => row[popoverState.column]),
                      returnUrl:
                        window.location.pathname + window.location.search,
                    };
                    localStorage.setItem(
                      "custom_type_context",
                      JSON.stringify(columnInfo)
                    );
                    router.push("/custom-type/new");
                  }}
                  variant="outline"
                  className="w-full mb-2"
                  disabled={isLoadingIdentifications}
                >
                  Create a new type for this column
                </Button>

                <Button
                  onClick={() => {
                    const controller = new AbortController();
                    handleIdentifyColumn(
                      popoverState.column,
                      controller.signal
                    );
                  }}
                  variant="secondary"
                  className="w-full"
                  disabled={
                    isLoadingIdentifications ||
                    state.identificationStatus[popoverState.column] ===
                      IdentificationStatus.IDENTIFYING ||
                    state.redisStatus[popoverState.column] ===
                      RedisStatus.MATCHING
                  }
                >
                  Identify column type
                </Button>
              </div>
            </div>
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
