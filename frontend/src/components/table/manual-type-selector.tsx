"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IdentificationStatus,
  RedisStatus,
  useTableStore,
} from "@/stores/table-store";
import { ALL_ONTOLOGY_KEYS, COLUMN_TYPES } from "@/utils/column-types";

interface ManualTypeSelectorProps {
  column: number;
  isLoadingIdentifications: boolean;
  handleCompareWithRedis: (
    column: number,
    type: string,
    signal: AbortSignal
  ) => Promise<void>;
}

export function ManualTypeSelector({
  column,
  isLoadingIdentifications,
  handleCompareWithRedis,
}: ManualTypeSelectorProps) {
  const { state, dispatch } = useTableStore();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Manual Type Selection</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={
              isLoadingIdentifications ||
              state.redisStatus[column] === RedisStatus.MATCHING ||
              state.identificationStatus[column] ===
                IdentificationStatus.IDENTIFYING
            }
          >
            {state.identifications[column]?.type || "Select a type..."}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuRadioGroup
            value={state.identifications[column]?.type || ""}
            onValueChange={async (value) => {
              // Update column identification
              dispatch({
                type: "setIdentification",
                column: column,
                identification: {
                  type: value,
                  description: `Manually set as ${value}`,
                },
              });
              dispatch({
                type: "setIdentificationStatus",
                column,
                status: IdentificationStatus.IDENTIFIED,
              });

              // If the selected type has an ontology key, start Redis comparison
              if (ALL_ONTOLOGY_KEYS.includes(value)) {
                const controller = new AbortController();
                await handleCompareWithRedis(column, value, controller.signal);
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
  );
}
