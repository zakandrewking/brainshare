/**
 * Component to display storage usage information
 */

import React from "react";

import { Progress } from "@/components/ui/progress";
import { Stack } from "@/components/ui/stack";

export const STORAGE_LIMIT_BYTES = 104857600; // 100MB in bytes (matches SQL)

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function StorageUsage({
  isOverLimit,
  usage,
}: {
  isOverLimit: boolean;
  usage: number;
}) {
  const percentage = (usage / STORAGE_LIMIT_BYTES) * 100;

  return (
    <Stack className="w-full" alignItems="center">
      <Stack direction="col" gap={1} className="w-full max-w-md">
        <div className="flex justify-between text-sm text-muted-foreground">
          Storage Usage: {formatBytes(usage)} /{" "}
          {formatBytes(STORAGE_LIMIT_BYTES)}
        </div>
        <Progress
          value={percentage}
          className={isOverLimit ? "bg-destructive" : undefined}
        />
        {isOverLimit && (
          <p className="text-sm text-destructive">
            Storage limit reached. Please delete some files to upload more.
          </p>
        )}
      </Stack>
    </Stack>
  );
}
