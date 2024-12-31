"use client";

import { useState } from "react";

import { toast } from "sonner";
import useSWR from "swr";

import {
  addTypeValues,
  deleteTypeValue,
  readTypeValues,
} from "@/actions/custom-type-values";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";

interface Props {
  id: number;
}

export function CustomTypeValues({ id }: Props) {
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: values = [], mutate } = useSWR(
    `/custom-type-values/${id}`,
    () => readTypeValues(id)
  );

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    if (values.includes(trimmedValue)) {
      toast.error("This value already exists");
      return;
    }

    setIsAdding(true);
    try {
      await addTypeValues(id, [trimmedValue]);
      setNewValue("");
      await mutate((currentData) => [...(currentData ?? []), trimmedValue]);
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
      await mutate((currentData) =>
        (currentData ?? []).filter((v) => v !== value)
      );
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
          disabled={isAdding}
        />
        <Button type="submit" disabled={isAdding || !newValue.trim()}>
          {isAdding ? "Adding..." : "Add"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-md border">
        {values.map((value: string) => (
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
            >
              X
            </Button>
          </div>
        ))}
      </div>
    </Stack>
  );
}
