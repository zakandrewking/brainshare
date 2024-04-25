import "./list.css";
import Link from "next/link";
import { ReactNode } from "react";
import { ST } from "next/dist/shared/lib/utils";

import { cn } from "@/lib/utils";

import { Stack } from "./stack";

export function List({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Stack direction="col" className={cn("w-full", className)}>
      {children}
    </Stack>
  );
}

export function ListItem({ children }: { children: ReactNode }) {
  return (
    <Stack
      direction="row"
      justifyContent="between"
      gap={0}
      className={"border-y-2 w-full"}
    >
      {children}
    </Stack>
  );
}

export function ListItemContent({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  return href ? (
    <Link
      href={href}
      className="hover:bg-accent py-1 pl-4 pr-1 self-stretch flex-grow flex items-center justify-start"
    >
      {children}
    </Link>
  ) : (
    <Stack direction="col">{children}</Stack>
  );
}

export function ListItemActions({ children }: { children: ReactNode }) {
  return <div className="p-1">{children}</div>;
}
