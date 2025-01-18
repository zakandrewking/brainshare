import React from "react";

import { useIdentificationStore } from "@/stores/identification-store";

import { Button } from "../ui/button";

interface FilterButtonsProps {
  column: number;
}

export function FilterButtons({ column }: FilterButtonsProps) {
  const { identifications, activeFilters, addFilter, removeFilter } =
    useIdentificationStore();

  const identification = identifications[column];
  if (!identification || identification.type === "unknown-type") return null;

  const thisColumnFilter = activeFilters.filter((f) => f.column === column);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={thisColumnFilter.some((f) => f.type === "invalid-only")}
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
        disabled={thisColumnFilter.some((f) => f.type === "valid-only")}
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
        disabled={thisColumnFilter.length === 0}
        onClick={() => {
          removeFilter(column);
        }}
      >
        Clear Filter
      </Button>
    </div>
  );
}
