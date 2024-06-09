import { ReactNode } from "react";

import { Stack } from "./stack";
import { cn } from "./utils";

/**
 * The container for any app content on the main page.
 */
export default function Container({
  gap = 0,
  className,
  children,
}: {
  gap?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Stack
      direction="col"
      alignItems="start"
      className={cn("p-6 sm:p-10 w-full", className)}
      gap={gap}
    >
      {children}
    </Stack>
  );
}
