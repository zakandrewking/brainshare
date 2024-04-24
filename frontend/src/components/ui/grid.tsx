export function Grid({
  children,
  gap = 2,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <div className={"grid grid-cols-12"} style={{ gap: `${gap / 4}rem` }}>
      {children}
    </div>
  );
}

export function Item({
  children,
  span = 12,
  className = "",
}: {
  children: React.ReactNode;
  span?: number;
  className?: string;
}) {
  // Tailwind does not support dynamic classes, so cannot use col-span-#
  return (
    <div
      style={{ gridColumn: `span ${span} / span ${span}` }}
      className={className}
    >
      {children}
    </div>
  );
}
