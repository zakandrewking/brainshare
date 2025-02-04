"use client";

import React from "react";

import { CircleAlert } from "lucide-react";

import { editStoreHooks as editHooks } from "@/stores/edit-store";
import {
  IdentificationStatus,
  RedisStatus,
  useIdentificationStoreHooks,
} from "@/stores/identification-store";

import { type CustomTypeContext } from "../custom-type/custom-type-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { InternalLink } from "../ui/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { FilterButtons } from "./filter-buttons";
import { PopoverState } from "./header-renderer";
import { ManualTypeSelector } from "./manual-type-selector";
import MatchesBox from "./matches-box";

interface ColumnPopoverProps {
  popoverState: PopoverState;
  prefixedId: string;
  isLoadingIdentifications: boolean;
  renderTable: () => void;
  onPopoverClose: () => void;
  onCustomTypeClick: (context: CustomTypeContext) => void;
  handleCompareWithRedis: (
    column: number,
    typeId: string,
    signal: AbortSignal
  ) => Promise<void>;
  handleIdentifyColumn: (column: number, signal: AbortSignal) => Promise<void>;
}

export function ColumnPopover({
  popoverState,
  prefixedId,
  isLoadingIdentifications,
  renderTable,
  onPopoverClose,
  onCustomTypeClick,
  handleCompareWithRedis,
  handleIdentifyColumn,
}: ColumnPopoverProps) {
  // edit store
  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  // identification store
  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();
  const redisStatus = idHooks.useRedisStatus();
  const redisMatchData = idHooks.useRedisMatchData();
  const redisInfo = idHooks.useRedisInfo();
  const stats = idHooks.useStats();
  const typeOptions = idHooks.useTypeOptions();
  const identificationStatus = idHooks.useIdentificationStatus();
  const setOptionMin = idHooks.useSetOptionMin();
  const setOptionMax = idHooks.useSetOptionMax();
  const setOptionLogarithmic = idHooks.useSetOptionLogarithmic();

  return (
    <Popover
      key={popoverState.column}
      defaultOpen={true}
      onOpenChange={(open) => !open && onPopoverClose()}
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
          {identifications?.[popoverState.column] && (
            <>
              {identificationStatus?.[popoverState.column] ===
                IdentificationStatus.DELETED && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground">
                  <CircleAlert className="h-6 w-6 text-red-500" />
                  <span>This custom type no longer exists.</span>
                </div>
              )}
              <div className="space-y-2">
                <div className="space-y-2">
                  <h4 className="font-medium">
                    {identifications?.[popoverState.column]?.type}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {identifications?.[popoverState.column]?.description}
                  </p>

                  {/* Custom type link */}
                  {identifications?.[popoverState.column]?.id && (
                    <InternalLink
                      href={`/type/${
                        identifications?.[popoverState.column]?.name
                      }`}
                      disabled={
                        identificationStatus?.[popoverState.column] ===
                        IdentificationStatus.DELETED
                      }
                    >
                      View Custom Type
                    </InternalLink>
                  )}
                </div>

                <MatchesBox
                  identification={identifications?.[popoverState.column]}
                  redisMatchData={redisMatchData?.[popoverState.column]!}
                  columnData={parsedData.map((row) => row[popoverState.column])}
                  min={typeOptions?.[popoverState.column]?.min ?? undefined}
                  max={typeOptions?.[popoverState.column]?.max ?? undefined}
                />

                <FilterButtons column={popoverState.column} />
              </div>
            </>
          )}

          {/* Redis match info */}
          {redisInfo?.[popoverState.column]?.link && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Resource Information</div>
              <a
                href={redisInfo?.[popoverState.column]?.link}
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
            </div>
          )}

          <ManualTypeSelector
            column={popoverState.column}
            isLoadingIdentifications={isLoadingIdentifications}
            handleCompareWithRedis={handleCompareWithRedis}
          />

          {/* Absolute bounds controls for numeric columns */}
          {identifications?.[popoverState.column]?.type === "integer-numbers" ||
          identifications?.[popoverState.column]?.type === "decimal-numbers" ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Absolute Bounds</div>
              {stats?.[popoverState.column] && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Min
                      </label>
                      <Input
                        type="number"
                        step={
                          identifications[popoverState.column]?.type ===
                          "integer-numbers"
                            ? "1"
                            : "any"
                        }
                        value={typeOptions?.[popoverState.column]?.min ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? null
                              : identifications[popoverState.column]?.type ===
                                "integer-numbers"
                              ? Math.round(Number(e.target.value))
                              : Number(e.target.value);
                          setOptionMin(popoverState.column, value);
                          // Force re-render of all cells in the column
                          renderTable();
                        }}
                        placeholder={"−∞"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Max
                      </label>
                      <Input
                        type="number"
                        step={
                          identifications[popoverState.column]?.type ===
                          "integer-numbers"
                            ? "1"
                            : "any"
                        }
                        value={typeOptions?.[popoverState.column]?.max ?? ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? null
                              : identifications[popoverState.column]?.type ===
                                "integer-numbers"
                              ? Math.round(Number(e.target.value))
                              : Number(e.target.value);
                          setOptionMax(popoverState.column, value);
                          // Force re-render of all cells in the column
                          renderTable();
                        }}
                        placeholder={"∞"}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={
                        typeOptions?.[popoverState.column]?.logarithmic ?? false
                      }
                      onCheckedChange={(checked) => {
                        setOptionLogarithmic(popoverState.column, checked);
                        // Force re-render of all cells in the column
                        renderTable();
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

          <div className="pt-4 border-t">
            <Button
              onClick={() => {
                const columnValues = parsedData.map(
                  (row) => row[popoverState.column]
                );
                // Map the current identification type to a custom type kind
                const currentType =
                  identifications?.[popoverState.column]?.type;
                let initialKind: "decimal" | "integer" | "enum" = "enum";
                if (currentType === "decimal-numbers") {
                  initialKind = "decimal";
                } else if (currentType === "integer-numbers") {
                  initialKind = "integer";
                }
                // Set the context and open the modal
                onCustomTypeClick({
                  columnIndex: popoverState.column,
                  columnName: headers?.[popoverState.column] ?? "",
                  allValues: columnValues.filter(
                    (value): value is string => value !== undefined
                  ),
                  prefixedId,
                  initialKind,
                  initialMinValue:
                    typeOptions?.[popoverState.column]?.min ?? undefined,
                  initialMaxValue:
                    typeOptions?.[popoverState.column]?.max ?? undefined,
                  initialLogScale:
                    typeOptions?.[popoverState.column]?.logarithmic,
                });
              }}
              variant="secondary"
              className="w-full mb-2"
              disabled={
                isLoadingIdentifications ||
                identificationStatus?.[popoverState.column] ===
                  IdentificationStatus.IDENTIFYING ||
                redisStatus?.[popoverState.column] === RedisStatus.MATCHING
              }
            >
              Create a new type for this column
            </Button>

            <Button
              onClick={() => {
                const controller = new AbortController();
                handleIdentifyColumn(popoverState.column, controller.signal);
              }}
              variant="secondary"
              className="w-full"
              disabled={
                isLoadingIdentifications ||
                identificationStatus?.[popoverState.column] ===
                  IdentificationStatus.IDENTIFYING ||
                redisStatus?.[popoverState.column] === RedisStatus.MATCHING
              }
            >
              Auto-identify column type
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
