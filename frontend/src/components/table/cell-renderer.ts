import { ColumnIdentification } from "@/actions/identify-column";

interface CellRendererProps {
  columnIdentifications: Record<number, ColumnIdentification>;
  columnRedisStatus: Record<number, { matches: number; total: number }>;
  columnRedisMatches: Record<number, Set<string>>;
  columnRedisInfo: Record<number, { link_prefix?: string }>;
}

export function createCellRenderer({
  columnIdentifications,
  columnRedisStatus,
  columnRedisMatches,
  columnRedisInfo,
}: CellRendererProps) {
  return function cellRenderer(
    instance: any,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: any,
    value: any,
    cellProperties: any
  ) {
    // Check if this is a boolean column
    const isBoolean = columnIdentifications[col]?.type === "boolean-values";
    if (isBoolean && value) {
      const lowerValue = value.toString().toLowerCase();
      td.classList.add("transition-colors");

      if (["true", "y", "1"].includes(lowerValue)) {
        td.classList.add(
          "bg-green-100",
          "text-green-800",
          "dark:bg-green-950",
          "dark:text-green-200"
        );
      } else if (["false", "n", "0"].includes(lowerValue)) {
        td.classList.add(
          "bg-red-100",
          "text-red-800",
          "dark:bg-red-950",
          "dark:text-red-200"
        );
      }
    }

    // Only add indicators and links for columns that have Redis matches
    if (columnRedisStatus[col]?.matches > 0) {
      const isMatch = columnRedisMatches[col]?.has(value);
      const linkPrefix = columnRedisInfo[col]?.link_prefix;

      if (isMatch && linkPrefix) {
        // Create container for link and icon
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "4px";

        // Create link wrapper
        const link = document.createElement("a");
        link.href = `${linkPrefix}${value}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.color = "inherit";
        link.style.textDecoration = "underline";
        link.style.textDecorationColor = "currentColor";
        link.style.textUnderlineOffset = "2px";
        link.innerHTML = value;

        // Create link-out icon
        const icon = document.createElement("span");
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
        icon.style.display = "inline-flex";

        // Add link and icon to container
        container.appendChild(link);
        container.appendChild(icon);

        // Clear existing content and add container
        td.innerHTML = "";
        td.appendChild(container);
      } else {
        td.innerHTML = value;
      }

      td.style.position = "relative";

      // Remove any existing indicator
      const existingIndicator = td.querySelector(".redis-match-indicator");
      if (existingIndicator) {
        existingIndicator.remove();
      }

      // Create indicator element
      const indicator = document.createElement("div");
      indicator.className = "redis-match-indicator";
      indicator.style.position = "absolute";
      indicator.style.right = "0";
      indicator.style.top = "0";
      indicator.style.bottom = "0";
      indicator.style.width = "3px";
      indicator.style.backgroundColor = isMatch
        ? "rgba(34, 197, 94, 0.2)"
        : "rgba(239, 68, 68, 0.2)";

      td.appendChild(indicator);
    } else {
      td.innerHTML = value;
    }

    return td;
  };
}
