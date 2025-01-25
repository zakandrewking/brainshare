"use client";

import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllTypes } from "@/hooks/use-types";
import {
  IdentificationStatus,
  RedisStatus,
  useIdentificationStore,
} from "@/stores/identification-store";

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
  const identifications = useIdentificationStore(
    (state) => state.identifications
  );
  const identificationStatus = useIdentificationStore(
    (state) => state.identificationStatus
  );
  const redisStatus = useIdentificationStore((state) => state.redisStatus);
  const setIdentification = useIdentificationStore(
    (state) => state.setIdentification
  );
  const setIdentificationStatus = useIdentificationStore(
    (state) => state.setIdentificationStatus
  );

  const allTypes = useAllTypes({
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Manual Type Selection</label>
      <Select
        value={identifications[column]?.type || ""}
        onValueChange={async (value) => {
          // Update column identification
          const selectedType = allTypes?.find((type) => type.name === value);
          if (selectedType) {
            setIdentification(column, {
              type: value,
              description:
                selectedType.description || `Manually set as ${value}`,
              is_custom: selectedType.is_custom,
              ...(selectedType.is_custom && {
                id: selectedType.id,
                kind: selectedType.kind,
                name: selectedType.name,
                min_value: selectedType.min_value,
                max_value: selectedType.max_value,
                log_scale: selectedType.log_scale,
              }),
            });
            setIdentificationStatus(column, IdentificationStatus.IDENTIFIED);

            // Start Redis comparison for custom types
            if (selectedType.is_custom) {
              const controller = new AbortController();
              const typeKey = selectedType.id;
              await handleCompareWithRedis(column, typeKey, controller.signal);
            }
          }
        }}
        disabled={
          isLoadingIdentifications ||
          redisStatus[column] === RedisStatus.MATCHING ||
          identificationStatus[column] === IdentificationStatus.IDENTIFYING
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a type..." />
        </SelectTrigger>
        <SelectContent>
          {allTypes?.map((type) => (
            <SelectItem key={type.name} value={type.name}>
              <div className="flex items-center justify-between w-full">
                <span>{type.name}</span>
                {type.is_custom && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    Custom
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
