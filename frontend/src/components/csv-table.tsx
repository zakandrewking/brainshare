/**
 * NOTE: CMD-C copy does not work in Chrome Canary with handsontable
 */

"use client";

import "./csv-table.css";
import "handsontable/dist/handsontable.full.min.css";

import React from "react";

import { registerAllModules } from "handsontable/registry";
import { usePathname } from "next/navigation";
import PQueue from "p-queue";
import { toast } from "sonner";

import { HotTable } from "@handsontable/react";

// TODO add handsontable context plugin
import { compareColumnWithRedis } from "@/actions/compare-column";
import { identifyColumn } from "@/actions/identify-column";
import { loadTableIdentifications } from "@/actions/table-identification";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { useEditStore } from "@/stores/edit-store";
import {
  Identification,
  IdentificationState,
  IdentificationStatus,
  RedisStatus,
  type Stats,
  useIdentificationStore,
} from "@/stores/identification-store";
import { createClient, useUser } from "@/utils/supabase/client";
import { getUniqueNonNullValues } from "@/utils/validation";

import ControlPanel from "./control-panel/control-panel";
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
  prefixedId: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

// --------------
// Main component
// --------------

export default function CSVTable({
  prefixedId,
  onLoadingChange,
}: CSVTableProps) {
  // -----
  // State
  // -----

  const identificationStore = useIdentificationStore();
  const [popoverState, setPopoverState] = React.useState<PopoverState | null>(
    null
  );
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
  const pathname = usePathname();

  const editStore = useEditStore();
  const parsedData = useEditStore((state) => state.parsedData);
  const headers = useEditStore((state) => state.headers);

  const supabase = createClient();
  const { user } = useUser();

  React.useEffect(() => {
    editStore.setHeaders([]);
  }, []);

  //     // TODO race condition here; need to used computed store values
  // // Apply all active filters
  // React.useEffect(() => {
  //   if (identificationStore.activeFilters.length === 0) {
  //     editStore.setFilteredData(parsedData);
  //     return;
  //   }

  //   let filtered = parsedData;
  //   for (const filter of identificationStore.activeFilters) {
  //     const matches = identificationStore.redisMatches[filter.column];
  //     const min =
  //       identificationStore.typeOptions[filter.column]?.min ?? undefined;
  //     const max =
  //       identificationStore.typeOptions[filter.column]?.max ?? undefined;

  //     switch (filter.type) {
  //       case "valid-only":
  //         // TODO share this logic with the matchedbox & indicator ring
  //         if (matches) {
  //           filtered = filtered.filter((row: string[]) =>
  //             matches.includes(row[filter.column]!)
  //           );
  //         } else if (min !== undefined || max !== undefined) {
  //           filtered = filtered.filter((row: string[]) => {
  //             const value = Number(row[filter.column]);
  //             if (isNaN(value)) return false;
  //             if (min !== undefined && value >= min) return true;
  //             if (max !== undefined && value <= max) return true;
  //             return false;
  //           });
  //         }
  //         break;
  //       case "invalid-only":
  //         // TODO share this logic with the matchedbox & indicator ring
  //         if (matches) {
  //           filtered = filtered.filter(
  //             (row: string[]) => !matches.includes(row[filter.column]!)
  //           );
  //         } else if (min !== undefined || max !== undefined) {
  //           filtered = filtered.filter((row: string[]) => {
  //             const value = Number(row[filter.column]);
  //             if (isNaN(value)) return false;
  //             if (min !== undefined && value < min) return true;
  //             if (max !== undefined && value > max) return true;
  //             return false;
  //           });
  //         }
  //         break;
  //     }
  //   }

  //   editStore.setFilteredData(filtered);
  // }, [identificationStore.activeFilters, parsedData]);

  // ------------
  // Handlers
  // ------------

  const handleCheckIdentifications = async (identifications: {
    [column: number]: Identification;
  }) => {
    const customIds = Object.values(identifications)
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
    Object.entries(identificationStore.identifications)
      .filter(([_, identification]) => identification.id !== undefined)
      .forEach(([column, identification]) => {
        if (!data.some((type) => type.id === identification.id)) {
          identificationStore.setIdentificationStatus(
            Number(column),
            IdentificationStatus.DELETED
          );
        }
      });
  };

  const handleCompareWithRedis = async (
    column: number,
    typeId: string,
    signal: AbortSignal
  ) => {
    const columnValues = parsedData.map((row) => row[column] ?? "");

    // Set column Redis status to MATCHING
    identificationStore.setRedisStatus(column, RedisStatus.MATCHING);

    try {
      const result = await compareColumnWithRedis(columnValues, typeId);

      // If aborted, don't update state
      if (signal.aborted) return;

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      // Set Redis data
      identificationStore.setRedisStatus(column, RedisStatus.MATCHED);
      identificationStore.setRedisData(column, {
        redisStatus: RedisStatus.MATCHED,
        matchData: {
          matches: result.matches.length,
          total: columnValues.length,
        },
        matches: result.matches,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("Error comparing with Redis:", error);
      identificationStore.setRedisStatus(column, RedisStatus.ERROR);
    }
  };

  const handleIdentifyColumn = async (column: number, signal: AbortSignal) => {
    let ontologyKeyNeedsComparison: string | null = null;

    // update status
    identificationStore.setIdentificationStatus(
      column,
      IdentificationStatus.IDENTIFYING
    );

    try {
      const columnName = headers?.[column];
      const columnData = parsedData.map((row: string[]) => row[column]);
      const sampleValues = getUniqueNonNullValues(columnData, 10);
      const identification = await identifyColumn(columnName!, sampleValues);

      // If aborted, don't update state
      if (signal.aborted) return;

      // done identifying
      identificationStore.setIdentification(column, identification);
      identificationStore.setIdentificationStatus(
        column,
        IdentificationStatus.IDENTIFIED
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
      identificationStore.setIdentificationStatus(
        column,
        IdentificationStatus.ERROR
      );
    }

    // now compare with Redis
    if (ontologyKeyNeedsComparison && !signal.aborted) {
      await handleCompareWithRedis(column, ontologyKeyNeedsComparison, signal);
    }
  };

  const handleAutoIdentify = async () => {
    if (!parsedData[0]) return;

    parsedData[0]
      .map((_: string, i: number) => i)
      .filter(
        (columnIndex: number) =>
          !identificationStore.identifications[columnIndex]
      )
      .forEach((columnIndex: number) => {
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
      const columnData = parsedData.map((row: string[]) => row[column]);

      renderHeader(
        th,
        column,
        headers ?? [],
        identificationStore.identificationStatus[column],
        identificationStore.redisStatus[column],
        identificationStore.identifications[column],
        identificationStore.redisMatchData[column],
        popoverState,
        setPopoverState,
        columnData,
        user !== null
      );
    },
    [
      identificationStore.identifications,
      identificationStore.identificationStatus,
      identificationStore.redisStatus,
      identificationStore.redisMatchData,
      popoverState,
      setPopoverState,
      parsedData,
      headers,
      user,
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
    Object.entries(identificationStore.identifications).forEach(
      ([col, identification]) => {
        const colIndex = parseInt(col);
        if (
          (identification.type === "integer-numbers" ||
            identification.type === "decimal-numbers") &&
          !identificationStore.stats[colIndex]
        ) {
          const columnData = parsedData.map((row) => row[colIndex]);
          identificationStore.setStats(
            colIndex,
            calculateColumnStats(columnData)
          );
        }
      }
    );
  }, [identificationStore.identifications, parsedData, calculateColumnStats]);

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
      identificationStore.reset();
      setDidStartIdentification(false);
    };
  }, []);

  // reset state when we get a new file
  React.useEffect(() => {
    identificationStore.reset();
    identificationStore.setPrefixedId(prefixedId);
  }, [prefixedId]);

  // Load identifications and maybe auto-identify columns
  useAsyncEffect(
    async () => {
      if (!parsedData.length) return;
      if (!user) {
        console.log("Not logged in; not loading identifications");
        setIsLoadingIdentifications(false);
        return;
      }

      setIsLoadingIdentifications(true);
      let existingIdentifications: IdentificationState | null = null;

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
          identificationStore.addFilter(filter.column, filter.type);
        });
        Object.entries(existingIdentifications.identifications).forEach(
          ([column, identification]) => {
            identificationStore.setIdentification(
              Number(column),
              identification
            );
            identificationStore.setIdentificationStatus(
              Number(column),
              IdentificationStatus.IDENTIFIED
            );
          }
        );
        Object.entries(existingIdentifications.redisStatus).forEach(
          ([column, status]) => {
            identificationStore.setRedisStatus(
              Number(column),
              status as RedisStatus
            );
          }
        );
        Object.entries(existingIdentifications.redisMatchData).forEach(
          ([column, data]) => {
            identificationStore.setRedisData(Number(column), {
              redisStatus: existingIdentifications.redisStatus[
                Number(column)
              ] as RedisStatus,
              matchData: data as { matches: number; total: number },
              matches: existingIdentifications.redisMatches[Number(column)],
              info: existingIdentifications.redisInfo[Number(column)],
            });
          }
        );
        Object.entries(existingIdentifications.stats).forEach(
          ([column, stats]) => {
            identificationStore.setStats(Number(column), stats as Stats);
          }
        );
      }

      // check that identifications point to valid types
      if (existingIdentifications) {
        await handleCheckIdentifications(identificationStore.identifications);
      }

      // No existing identifications, start auto-identification if enabled
      if (!AUTO_START || didStartIdentification || existingIdentifications) {
        return;
      }
      setDidStartIdentification(true);

      // Queue all columns for identification
      await handleAutoIdentify();
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
    <>
      <ControlPanel autoIdentify={handleAutoIdentify} pathname={pathname} />
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
          popoverState={popoverState}
          prefixedId={prefixedId}
          isLoadingIdentifications={isLoadingIdentifications}
          hotRef={hotRef}
          onPopoverClose={() => setPopoverState(null)}
          onCustomTypeClick={(context) => {
            setCustomTypeContext(context);
            setCustomTypeModalOpen(true);
          }}
          handleCompareWithRedis={handleCompareWithRedis}
          handleIdentifyColumn={handleIdentifyColumn}
          pathname={pathname}
        />
      )}

      <ActiveFilters />

      <div className="absolute top-[117px] left-0 right-0 bottom-0 overflow-scroll z-10">
        <HotTable
          ref={hotRef}
          data={parsedData}
          colHeaders={headers ?? []}
          rowHeaders={true}
          readOnly={true}
          columnHeaderHeight={42}
          contextMenu={["copy", "cut"]}
          licenseKey="non-commercial-and-evaluation"
          afterGetColHeader={afterGetColHeader}
          cells={(_, col: number) => ({
            renderer: createCellRenderer({
              identification: identificationStore.identifications[col],
              redisMatches: identificationStore.redisMatches[col],
              stats: identificationStore.stats[col],
              typeOptions: identificationStore.typeOptions[col],
            }),
          })}
          beforeContextMenuSetItems={() => [
            {
              name: "test",
              key: "test",
              hidden: false,
              disabled: false,
              callback: () => {
                alert("clicked");
              },
            },
          ]}
        />
      </div>
    </>
  );
}
