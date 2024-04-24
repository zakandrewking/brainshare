import { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Stack({
  component = "div",
  className = "",
  direction = "col",
  gap = 2,
  alignItems = "center",
  justifyContent = "center",
  children,
}: {
  component?: keyof JSX.IntrinsicElements;
  className?: string;
  direction?: "row" | "col";
  gap?: number;
  alignItems?: "start" | "center" | "end";
  justifyContent?: "start" | "center" | "end";
  children: ReactNode;
}) {
  const Tag = component;
  return (
    <Tag
      className={cn("flex", className)}
      style={{
        alignItems: alignItems,
        justifyContent: justifyContent,
        flexDirection: direction === "col" ? "column" : "row",
        gap: `${gap / 4}rem`,
      }}
    >
      {children}
    </Tag>
  );
}

function FillSpace() {
  return <div className="flex-1" />;
}

export { Stack, FillSpace };
