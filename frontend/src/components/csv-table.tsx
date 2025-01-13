/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/dist/handsontable.full.min.css";

import React from "react";

import { registerAllModules } from "handsontable/registry";
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
import { createClient } from "@/utils/supabase/client";
import { getUniqueNonNullValues } from "@/utils/validation";

import { CustomTypeContext } from "./custom-type/custom-type-form";
import CustomTypeModal from "./custom-type/custom-type-modal";
import { ActiveFilters } from "./table/active-filters";
import { createCellRenderer } from "./table/cell-renderer";
import { ColumnPopover } from "./table/column-popover";
import { PopoverState, renderHeader } from "./table/header-renderer";

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
  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );
  const [filteredData, setFilteredData] = React.useState<any[][]>(parsedData);
  const [didStartIdentification, setDidStartIdentification] =
    React.useState(false);
  const [isLoadingIdentifications, setIsLoadingIdentifications] =
    React.useState(true);
  const [customTypeModalOpen, setCustomTypeModalOpen] = React.useState(false);
  const [customTypeContext, setCustomTypeContext] =
    React.useState<CustomTypeContext | null>(null);
  const hotRef = React.useRef<any>(null);
  const identificationQueue = React.useRef(new PQueue({ concurrency: 3 }));
  const abortController = React.useRef(new AbortController());

  const supabase = createClient();

  // Apply all active filters
  React.useEffect(() => {
    if (state.activeFilters.length === 0) {
      setFilteredData(parsedData);
      return;
    }

    let filtered = parsedData;
    for (const filter of state.activeFilters) {
      const matches = state.redisMatches[filter.column];
      const min = state.typeOptions[filter.column]?.min ?? undefined;
      const max = state.typeOptions[filter.column]?.max ?? undefined;

      switch (filter.type) {
        case "valid-only":
          // TODO share this logic with the matchedbox & indicator ring
          if (matches) {
            filtered = filtered.filter((row) =>
              matches.has(row[filter.column])
            );
          } else if (min !== undefined || max !== undefined) {
            filtered = filtered.filter((row) => {
              const value = Number(row[filter.column]);
              if (isNaN(value)) return false;
              if (min !== undefined && value >= min) return true;
              if (max !== undefined && value <= max) return true;
              return false;
            });
          }
          break;
        case "invalid-only":
          // TODO share this logic with the matchedbox & indicator ring
          if (matches) {
            filtered = filtered.filter(
              (row) => !matches.has(row[filter.column])
            );
          } else if (min !== undefined || max !== undefined) {
            filtered = filtered.filter((row) => {
              const value = Number(row[filter.column]);
              if (isNaN(value)) return false;
              if (min !== undefined && value < min) return true;
              if (max !== undefined && value > max) return true;
              return false;
            });
          }
          break;
      }
    }

    setFilteredData(filtered);
  }, [state.activeFilters, parsedData]);

  // ------------
  // Handlers
  // ------------

  const handleCheckIdentifications = async (
    existingIdentifications: TableStoreState
  ) => {
    const customIds = Object.values(existingIdentifications.identifications)
      .filter((i) => i.id !== undefined)
      .map((i) => i.id);
    // check that identifications point to valid types
    const { data, error } = await supabase
      .from("custom_type")
      .select("id")
      .in("id", customIds);
    if (error) {
      console.error("Error checking identifications:", error);
      throw error;
    }

    // if any identifications point to invalid types, reset them
    Object.entries(existingIdentifications.identifications)
      .filter(([_, identification]) => identification.id !== undefined)
      .forEach(([column, identification]) => {
        if (!data.some((type) => type.id === identification.id)) {
          dispatch(
            actions.setIdentificationStatus(
              Number(column),
              IdentificationStatus.DELETED
            )
          );
        }
      });
  };

  const handleCompareWithRedis = async (
    column: number,
    typeId: string,
    signal: AbortSignal
  ) => {
    const columnValues = parsedData.map((row) => row[column]);

    // Set column Redis status to MATCHING
    dispatch(actions.setRedisStatus(column, RedisStatus.MATCHING));

    try {
      const result = await compareColumnWithRedis(columnValues, typeId);

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
          // info: {
          //   link_prefix: result.info.link_prefix,
          //   description: result.info.description,
          //   num_entries: result.info.num_entries,
          //   link: result.info.link,
          // },
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
      const columnData = parsedData.map((row) => row[column]);
      const sampleValues = getUniqueNonNullValues(columnData, 10);
      const identification = await identifyColumn(columnName!, sampleValues);

      // If aborted, don't update state
      if (signal.aborted) return;

      // done identifying
      dispatch(actions.setIdentification(column, identification));
      dispatch(
        actions.setIdentificationStatus(column, IdentificationStatus.IDENTIFIED)
      );

      // Start Redis comparison for custom types
      if (identification.is_custom && identification.id) {
        const controller = new AbortController();
        const typeKey = identification.id;
        await handleCompareWithRedis(column, typeKey, controller.signal);
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

  // // Compare to Redis if the column is identified as a custom type
  // React.useEffect(() => {
  //   Object.entries(state.identifications).forEach(([col, identification]) => {
  //     if (identification.kind === "enum") {
  //       handleCompareWithRedis(
  //         Number(col),
  //         identification.type,
  //         abortControllet.current.signal
  //       );
  //     }
  //   });
  // }, [state.identifications]);

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
        existingIdentifications.activeFilters.forEach((filter) => {
          dispatch(actions.addFilter(filter.column, filter.type));
        });
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

      // check that identifications point to valid types
      if (existingIdentifications) {
        await handleCheckIdentifications(existingIdentifications);
      }

      // No existing identifications, start auto-identification if enabled
      if (!AUTO_START || didStartIdentification || existingIdentifications) {
        return;
      }
      setDidStartIdentification(true);

      // Queue all columns for identification
      if (!parsedData[0]) return;
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
      {customTypeContext && (
        <CustomTypeModal
          context={{
            ...customTypeContext,
          }}
          open={customTypeModalOpen}
          onOpenChange={setCustomTypeModalOpen}
          handleCompareWithRedis={handleCompareWithRedis}
        />
      )}
      {popoverState && (
        <ColumnPopover
          state={state}
          popoverState={popoverState}
          parsedData={parsedData}
          headers={headers}
          prefixedId={prefixedId}
          isLoadingIdentifications={isLoadingIdentifications}
          hotRef={hotRef}
          dispatch={dispatch}
          actions={actions}
          onPopoverClose={() => setPopoverState(null)}
          onCustomTypeClick={(context) => {
            setCustomTypeContext(context);
            setCustomTypeModalOpen(true);
          }}
          handleCompareWithRedis={handleCompareWithRedis}
          handleIdentifyColumn={handleIdentifyColumn}
        />
      )}

      <div className="px-4">
        <ActiveFilters headers={headers} />
      </div>

      <div className="h-[calc(100vh-130px)] overflow-hidden w-full fixed top-[130px] left-0">
        <HotTable
          ref={hotRef}
          data={filteredData}
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
              typeOptions: state.typeOptions[col],
            }),
          })}
        />
      </div>
    </div>
  );
}
