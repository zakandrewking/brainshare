import {
  ColumnIdentification,
  ColumnRedisStatus,
  ColumnStats,
} from "@/stores/table-store";

interface CellRendererProps {
  columnIdentification: ColumnIdentification | undefined;
  columnRedisStatus: ColumnRedisStatus | undefined;
  columnRedisMatches: Set<string> | undefined;
  columnRedisInfo: { link_prefix?: string } | undefined;
  columnStats: ColumnStats | undefined;
}

export function createCellRenderer({
  columnIdentification,
  columnRedisStatus,
  columnRedisMatches,
  columnRedisInfo,
  columnStats,
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
    const columnType = columnIdentification?.type;

    // Handle numeric columns (integers and decimals)
    if (columnType === "integer-numbers" || columnType === "decimal-numbers") {
      const numValue = parseFloat(value);

      if (columnStats && !isNaN(numValue)) {
        // falls back to end of function

        // Calculate percentage for bar width
        const isPositive = numValue >= 0;
        const maxAbs = Math.max(
          Math.abs(columnStats.min),
          Math.abs(columnStats.max)
        );
        const percentage = (Math.abs(numValue) / maxAbs) * 50; // 50% is half the cell width

        // Create container
        const container = document.createElement("div");
        container.className =
          "relative w-full h-full flex items-center justify-center p-0";

        // Create text content
        const span = document.createElement("span");
        span.className = "z-10 px-1";
        span.appendChild(document.createTextNode(value));

        // Create bar
        const bar = document.createElement("div");
        bar.className = `absolute inset-0 ${
          isPositive ? "left-1/2" : "right-1/2"
        }`;
        bar.style.width = `${percentage}%`;
        bar.style.backgroundColor = isPositive
          ? "rgba(34, 197, 94, 0.1)"
          : "rgba(239, 68, 68, 0.1)";

        // Assemble elements
        container.appendChild(span);
        container.appendChild(bar);

        // Clear and update cell
        td.style.position = "relative";
        while (td.firstChild) {
          td.removeChild(td.firstChild);
        }
        td.appendChild(container);
        return td;
      }
    }

    // Handle boolean columns
    const isBoolean = columnType === "boolean-values";
    if (isBoolean && value) {
      const lowerValue = value.toString().toLowerCase();
      td.classList.add("transition-colors");

      if (["true", "t", "y", "1"].includes(lowerValue)) {
        td.classList.add(
          "bg-green-100",
          "text-green-800",
          "dark:bg-green-950",
          "dark:text-green-200"
        );
      } else if (["false", "f", "n", "0"].includes(lowerValue)) {
        td.classList.add(
          "bg-red-100",
          "text-red-800",
          "dark:bg-red-950",
          "dark:text-red-200"
        );
      }
      while (td.firstChild) {
        td.removeChild(td.firstChild);
      }
      td.appendChild(document.createTextNode(value));
      return td;
    }

    // Handle Redis matches
    if (
      columnRedisStatus === ColumnRedisStatus.MATCHED &&
      columnRedisMatches &&
      columnRedisInfo
    ) {
      const isMatch = columnRedisMatches.has(value);
      const linkPrefix = columnRedisInfo.link_prefix;

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
        link.appendChild(document.createTextNode(value));

        // Create link-out icon (SVG is safe as it's our own content)
        const icon = document.createElement("span");
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
        icon.style.display = "inline-flex";

        // Add link and icon to container
        container.appendChild(link);
        container.appendChild(icon);

        // Clear existing content and add container
        while (td.firstChild) {
          td.removeChild(td.firstChild);
        }
        td.appendChild(container);
      } else {
        while (td.firstChild) {
          td.removeChild(td.firstChild);
        }
        td.appendChild(document.createTextNode(value));
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
      return td;
    }

    // fallback
    while (td.firstChild) {
      td.removeChild(td.firstChild);
    }
    td.appendChild(document.createTextNode(value));
    return td;
  };
}
