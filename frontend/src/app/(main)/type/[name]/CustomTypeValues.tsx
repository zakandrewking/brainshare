"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import useSWR from "swr";

import {
  addTypeValues,
  deleteTypeValue,
  getTypeValuesCount,
  readTypeValues,
} from "@/actions/custom-type-values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import useIsSsr from "@/hooks/use-is-ssr";

const VALUES_LIMIT = 300;

interface Props {
  id: string;
}

export function CustomTypeValues({ id }: Props) {
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const isSsr = useIsSsr();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: values,
    mutate: mutateValues,
    isLoading: isValuesLoading,
  } = useSWR(
    `/custom-type-values/${id}?limit=${VALUES_LIMIT}&filter=${debouncedSearchTerm}`,
    () => readTypeValues(id, VALUES_LIMIT, debouncedSearchTerm)
  );

  const { data: totalCount, mutate: mutateTotalCount } = useSWR(
    `/custom-type-values/${id}/count`,
    () => getTypeValuesCount(id)
  );

  const isActionDisabled = isAdding || isValuesLoading;

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    if (values && values.includes(trimmedValue)) {
      toast.error("This value already exists");
      return;
    }

    setIsAdding(true);
    try {
      await addTypeValues(id, [trimmedValue]);
      setNewValue("");
      await mutateValues((currentData) => [
        ...(currentData ?? []),
        trimmedValue,
      ]);
      await mutateTotalCount((currentCount) => (currentCount ?? 0) + 1);
      toast.success("Value added successfully");
    } catch (error) {
      console.error("Failed to add value:", error);
      toast.error("Failed to add value");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteValue = async (value: string) => {
    try {
      await deleteTypeValue(id, value);
      await mutateValues((currentData) =>
        (currentData ?? []).filter((v) => v !== value)
      );
      await mutateTotalCount((currentCount) => (currentCount ?? 1) - 1);
      toast.success("Value deleted successfully");
    } catch (error) {
      console.error("Failed to delete value:", error);
      toast.error("Failed to delete value");
    }
  };

  return (
    <Stack direction="col" alignItems="start" gap={4}>
      <form onSubmit={handleAddValue} className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Add a new value..."
          disabled={isActionDisabled}
        />
        <Button type="submit" disabled={isActionDisabled || !newValue.trim()}>
          {isAdding ? "Adding..." : "Add"}
        </Button>
      </form>

      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Filter values..."
        className="w-full"
        disabled={isSsr}
      />

      <div className="text-muted-foreground">
        {totalCount && debouncedSearchTerm !== "" && values !== undefined
          ? `Showing ${values.length} of ${totalCount} values`
          : totalCount &&
            totalCount > VALUES_LIMIT &&
            debouncedSearchTerm === ""
          ? `Showing first ${VALUES_LIMIT} of ${totalCount} values`
          : totalCount && debouncedSearchTerm === ""
          ? `Showing all ${totalCount} values`
          : ""}
      </div>

      <div className="divide-y divide-border rounded-md border">
        {isValuesLoading ? (
          <div className="px-4 py-2 text-muted-foreground">
            Loading values...
          </div>
        ) : values && values.length === 0 ? (
          <div className="px-4 py-2 text-muted-foreground">No values found</div>
        ) : (
          values?.map((value: string) => (
            <div
              key={value}
              className="flex items-center justify-between px-4 py-2"
            >
              <span className="font-mono text-sm">{value}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteValue(value)}
                className="h-7 px-2"
                disabled={isActionDisabled}
              >
                X
              </Button>
            </div>
          ))
        )}
      </div>
    </Stack>
  );
}
