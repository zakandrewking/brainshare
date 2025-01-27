import React from "react";

import { cn } from "@/utils/tailwind";

function Stack({
  component = "div",
  className = "",
  direction = "col",
  gap = 2,
  alignItems = "center",
  justifyContent = "center",
  wrap = false,
  href,
  style,
  children,
}: {
  component?: keyof React.JSX.IntrinsicElements | React.ComponentType<any>;
  className?: string;
  direction?: "row" | "col";
  gap?: number;
  alignItems?: "start" | "center" | "end";
  justifyContent?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  href?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const Tag = component;
  return (
    <Tag
      className={cn("flex", wrap && "flex-wrap", className)}
      style={{
        alignItems,
        justifyContent:
          justifyContent === "between" ? "space-between" : justifyContent,
        flexDirection: direction === "col" ? "column" : "row",
        gap: `${gap / 4}rem`,
        ...style,
      }}
      href={href}
    >
      {children}
    </Tag>
  );
}

function FillSpace() {
  return <div className="flex-1" />;
}

export { FillSpace, Stack };
