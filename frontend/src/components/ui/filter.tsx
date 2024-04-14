"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { CaretSortIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";

type FilterItemDefinition = {
  value: string;
  label: string;
};
interface FilterProps {
  items: FilterItemDefinition[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
}
export function Filter({ items, value, onValueChange }: FilterProps) {
  const [internalValue, setInternalValue] = useState<string[]>([]);

  const handleItemClick = function (item: FilterItemDefinition) {
    const newValue = selectedValues.includes(item.value)
      ? selectedValues.filter((value) => value !== item.value)
      : [...selectedValues, item.value];
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const selectedValues = useMemo(() => {
    return value !== undefined ? value : internalValue;
  }, [value, internalValue]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          Filter data
          {/* <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" /> */}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {items.map((item) => {
          return (
            <DropdownMenuCheckboxItem
              key={item.value}
              checked={selectedValues.includes(item.value)}
              onCheckedChange={() => handleItemClick(item)}
              onSelect={(e) => e.preventDefault()}
            >
              {item.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
