import { ReactNode } from "react";

function Stack({
  component = "div",
  className = "",
  direction = "column",
  spacing = 0,
  children,
}: {
  component?: keyof JSX.IntrinsicElements;
  className?: string;
  direction: "row" | "col";
  spacing?: number;
  children: ReactNode;
}) {
  const Tag = component;
  return (
    <Tag
      className={`flex flex-${direction} items-center gap-${spacing} ${className}`}
    >
      {children}
    </Tag>
  );
}

function FillSpace() {
  return <div className="flex-1" />;
}

export { Stack, FillSpace };
