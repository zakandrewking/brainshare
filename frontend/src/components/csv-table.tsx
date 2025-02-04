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
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import {
  Identification,
  IdentificationStatus,
  RedisStatus,
  type Stats,
  useIdentificationStoreHooks,
} from "@/stores/identification-store";
import { createClient, useUser } from "@/utils/supabase/client";
import { getUniqueNonNullValues } from "@/utils/validation";

import ControlPanel from "./control-panel/control-panel";
import { CustomTypeContext } from "./custom-type/custom-type-form";
import CustomTypeModal from "./custom-type/custom-type-modal";
import LoadingDetailBar from "./loading-detail-bar";
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
}

// --------------
// Main component
// --------------

export default function CSVTable({ prefixedId }: CSVTableProps) {
  // -----
  // State
  // -----

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

  // edit store
  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  // identification store
  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();
  const identificationStatus = idHooks.useIdentificationStatus();
  const redisMatchData = idHooks.useRedisMatchData();
  const redisMatches = idHooks.useRedisMatches();
  const redisStatus = idHooks.useRedisStatus();
  const stats = idHooks.useStats();
  const typeOptions = idHooks.useTypeOptions();
  const setIdentification = idHooks.useSetIdentification();
  const setIdentificationStatus = idHooks.useSetIdentificationStatus();
  const setRedisData = idHooks.useSetRedisData();
  const setRedisStatus = idHooks.useSetRedisStatus();
  const setStats = idHooks.useSetStats();
  const setIsIdentifying = idHooks.useSetIsIdentifying();

  // auth
  const supabase = createClient();
  const { user } = useUser();

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
  //             if (max !== undefined && value  !matches.includes(row[filter.column]!)
  //           );
  //         } else if (min !== undefined || max !== undefined) {
  //           filtered = filtered.filter((row: string[]) => {
  //             const value = Number(row[filter.column]);
  //             if (isNaN(value)) return false;
  //             if (min !== undefined && value  max) return true;
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
    Object.entries(identifications)
      .filter(([_, identification]) => identification.id !== undefined)
      .forEach(([column, identification]) => {
        if (!data.some((type) => type.id === identification.id)) {
          setIdentificationStatus(Number(column), IdentificationStatus.DELETED);
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
    setRedisStatus(column, RedisStatus.MATCHING);

    try {
      const result = await compareColumnWithRedis(columnValues, typeId);

      // If aborted, don't update state
      if (signal.aborted) return;

      toast.success(`Comparison Results:
        ${result.matches.length} matches found
        ${result.missingInRedis.length} values missing in Redis
        ${result.missingInColumn.length} values missing in column`);

      // Set Redis data
      setRedisStatus(column, RedisStatus.MATCHED);
      setRedisData(column, {
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
      setRedisStatus(column, RedisStatus.ERROR);
    }
  };

  const handleIdentifyColumn = async (column: number, signal: AbortSignal) => {
    // console.log("handleIdentifyColumn", column);
    let ontologyKeyNeedsComparison: string | null = null;

    // update status
    setIdentificationStatus(column, IdentificationStatus.IDENTIFYING);

    try {
      const columnName = headers?.[column];
      const columnData = parsedData.map((row: string[]) => row[column]);
      const sampleValues = getUniqueNonNullValues(columnData, 10);
      const identification = await identifyColumn(columnName!, sampleValues);

      // If aborted, don't update state
      if (signal.aborted) {
        return;
      }

      // done identifying
      setIdentification(column, identification);
      setIdentificationStatus(column, IdentificationStatus.IDENTIFIED);

      // Start Redis comparison for custom types
      if (identification.is_custom && identification.id) {
        const controller = new AbortController();
        const typeKey = identification.id;
        await handleCompareWithRedis(column, typeKey, controller.signal);
      }
    } catch (error) {
      // console.log("error identifying column; maybe aborted", column);
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("Error identifying column:", error);
      setIdentificationStatus(column, IdentificationStatus.ERROR);
    }

    // now compare with Redis
    if (ontologyKeyNeedsComparison && !signal.aborted) {
      await handleCompareWithRedis(column, ontologyKeyNeedsComparison, signal);
    }
  };

  const handleRenderTable = () => {
    if (hotRef.current?.hotInstance) {
      hotRef.current.hotInstance.render();
    }
  };

  const handleAutoIdentify = async (overwrite: boolean = false) => {
    if (!parsedData[0]) return;

    setIsIdentifying(true);

    // if we overwriting, let's clear the queue
    if (overwrite) {
      abortController.current.abort("Restarting auto-identification");
      abortController.current = new AbortController();
      identificationQueue.current.clear();
    }

    let cols = parsedData[0].map((_: string, i: number) => i);
    if (!overwrite) {
      cols = cols.filter(
        (columnIndex: number) => !identifications?.[columnIndex]
      );
    }
    cols.forEach((columnIndex: number) => {
      identificationQueue.current.add(
        async ({ signal }) => {
          try {
            await handleIdentifyColumn(columnIndex, signal!);
          } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
              // Ignore abort errors
              return;
            }
            console.error("Error identifying column:", error);
            throw error;
          }
        },
        { signal: abortController.current.signal }
      );
    });

    identificationQueue.current
      .onIdle()
      .then(() => {
        setIsIdentifying(false);
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
        identificationStatus?.[column],
        redisStatus?.[column],
        identifications?.[column],
        redisMatchData?.[column],
        popoverState,
        setPopoverState,
        columnData,
        user !== null
      );
    },
    [
      identifications,
      identificationStatus,
      redisStatus,
      redisMatchData,
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

  // rerender handsontable when identifications change
  React.useEffect(() => {
    handleRenderTable();
  }, [identifications, identificationStatus]);

  // Update column stats when column is identified as numeric
  React.useEffect(() => {
    Object.entries(identifications ?? {}).forEach(([col, identification]) => {
      const colIndex = parseInt(col);
      if (
        (identification.type === "integer-numbers" ||
          identification.type === "decimal-numbers") &&
        !stats?.[colIndex]
      ) {
        const columnData = parsedData.map((row) => row[colIndex]);
        setStats(colIndex, calculateColumnStats(columnData));
      }
    });
  }, [identifications, parsedData, calculateColumnStats, stats, setStats]);

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
    const iqRef = identificationQueue.current;
    return () => {
      abortController.current.abort("Unmounting");
      abortController.current = new AbortController();
      iqRef.clear();
    };
  }, []);

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

      // No existing identifications, start auto-identification if enabled
      if (!AUTO_START || didStartIdentification) {
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
      <LoadingDetailBar />

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
          renderTable={handleRenderTable}
          onPopoverClose={() => setPopoverState(null)}
          onCustomTypeClick={(context) => {
            setCustomTypeContext(context);
            setCustomTypeModalOpen(true);
          }}
          handleCompareWithRedis={handleCompareWithRedis}
          handleIdentifyColumn={handleIdentifyColumn}
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
              identification: identifications?.[col],
              redisMatches: redisMatches?.[col],
              stats: stats?.[col],
              typeOptions: typeOptions?.[col],
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
