import React from "react";

import { useIdentificationStore } from "@/stores/identification-store";

import { Button } from "../ui/button";

export function ActiveFilters() {
  const { activeFilters, removeFilter } = useIdentificationStore();

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => (
        <Button
          key={`${filter.column}-${filter.type}`}
          variant="outline"
          size="sm"
          onClick={() => {
            removeFilter(filter.column);
          }}
        >
          {filter.type === "invalid-only"
            ? "Only Invalid Values"
            : "Only Valid Values"}
          <span className="ml-2 text-xs text-muted-foreground">
            Column {filter.column + 1}
          </span>
        </Button>
      ))}
    </div>
  );
}
