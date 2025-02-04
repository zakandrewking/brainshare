import React from "react";

import { useIdentificationStoreHooks } from "@/stores/identification-store";

import { Button } from "../ui/button";

interface FilterButtonsProps {
  column: number;
}

export function FilterButtons({ column }: FilterButtonsProps) {
  // identification store
  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();
  const activeFilters = idHooks.useActiveFilters();
  const addFilter = idHooks.useAddFilter();
  const removeFilter = idHooks.useRemoveFilter();

  const identification = identifications?.[column];
  if (!identification || identification.type === "unknown-type") return null;

  const thisColumnFilter = activeFilters?.filter((f) => f.column === column);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={
          thisColumnFilter?.some((f) => f.type === "invalid-only") ?? false
        }
        onClick={() => {
          addFilter(column, "invalid-only");
        }}
      >
        Show Only Invalid Values
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={
          thisColumnFilter?.some((f) => f.type === "valid-only") ?? false
        }
        onClick={() => {
          addFilter(column, "valid-only");
        }}
      >
        Show Only Valid Values
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!thisColumnFilter?.length}
        onClick={() => {
          removeFilter(column);
        }}
      >
        Clear Filter
      </Button>
    </div>
  );
}
