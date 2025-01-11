import React from "react";

import { useTableStore } from "@/stores/table-store";

import { Button } from "../ui/button";

interface FilterButtonsProps {
  column: number;
}

export function FilterButtons({ column }: FilterButtonsProps) {
  const { state, dispatch, actions } = useTableStore();

  const identification = state.identifications[column];
  if (!identification || identification.type === "unknown-type") return null;

  const thisColumnFilter = state.activeFilters.filter(
    (f) => f.column === column
  );

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={thisColumnFilter.some((f) => f.type === "invalid-only")}
        onClick={() => {
          dispatch(actions.addFilter(column, "invalid-only"));
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
          dispatch(actions.addFilter(column, "valid-only"));
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
          dispatch(actions.removeFilter(column));
        }}
      >
        Clear Filter
      </Button>
    </div>
  );
}
