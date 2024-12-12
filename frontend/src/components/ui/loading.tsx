"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/utils/tailwind";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function DelayedLoadingSpinner({
  delayMs = 500,
  className,
}: {
  delayMs?: number;
  className?: string;
}) {
  const openTimerRef = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    openTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      clearTimeout(openTimerRef.current);
    };
  });

  return (
    <LoadingSpinner
      className={cn(
        "transition-opacity duration-700 ease-in",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
