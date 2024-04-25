import { ReactNode } from "react";

import { Stack } from "./stack";

/**
 * The container for any app content on the main page.
 */
export default function Container({
  gap = 0,
  children,
}: {
  gap?: number;
  children: ReactNode;
}) {
  return (
    <Stack
      direction="col"
      alignItems="start"
      className="p-6 sm:p-10 w-full"
      gap={gap}
    >
      {children}
    </Stack>
  );
}
