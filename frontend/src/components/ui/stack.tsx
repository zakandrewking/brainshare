import { ReactNode } from "react";

import { cn } from "@/lib/utils";

function Stack({
  component = "div",
  className = "",
  direction = "col",
  gap = 0,
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
      className={cn(
        `flex flex-${direction} items-${alignItems} justify-${justifyContent} gap-${gap}`,
        className
      )}
    >
      {children}
    </Tag>
  );
}

function FillSpace() {
  return <div className="flex-1" />;
}

export { Stack, FillSpace };
