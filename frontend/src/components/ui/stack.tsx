import { ReactNode } from "react";

function Stack({
  direction = "column",
  spacing = 0,
  children,
}: {
  direction: "row" | "column";
  spacing?: number;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-${direction} items-center gap-${spacing}`}>
      {children}
    </div>
  );
}

function FillSpace() {
  return <div className="flex-1" />;
}

export { Stack, FillSpace };
