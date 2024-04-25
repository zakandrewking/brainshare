import "./list.css";
import Link from "next/link";
import { ReactNode } from "react";

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
    <Stack
      direction="col"
      gap={0}
      className={cn("w-full max-w-[700px]", className)}
    >
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
      className={"border-t-[1px] last:border-b-[1px] w-full"}
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
  const Tag = href ? Link : "div";
  return (
    <Tag
      href={href ?? ""}
      className={cn(
        href ? "hover:bg-accent" : "",
        "py-1 pl-4 pr-1 self-stretch flex-grow flex items-center justify-start"
      )}
    >
      {children}
    </Tag>
  );
}

export function ListItemActions({ children }: { children: ReactNode }) {
  return <div className="p-1 border-l-[1px] border-dotted">{children}</div>;
}
