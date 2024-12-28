"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/utils/tailwind";

interface MiniLoadingSpinnerProps {
  className?: string;
}

export function MiniLoadingSpinner({ className }: MiniLoadingSpinnerProps) {
  return (
    <Loader2
      className={cn(
        "fixed top-[75px] right-[10px] h-4 w-4 animate-spin",
        className
      )}
    />
  );
}
