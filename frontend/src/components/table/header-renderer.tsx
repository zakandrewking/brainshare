import {
  Identification,
  IdentificationStatus,
  RedisStatus,
} from "@/stores/table-store";
import { ACCEPTABLE_TYPES } from "@/utils/column-types";
import {
  calculateEnumPercentage,
  calculateNumericPercentage,
} from "@/utils/validation";

export interface PopoverState {
  column: number;
  rect: {
    left: number;
    top: number;
    bottom: number;
  };
}

// Helper function to create progress ring SVG
function createProgressRing(percentage: number): string {
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = (percentage / 100) * circumference;
  const strokeDashoffset = circumference - strokeDasharray;

  return `<svg width="20" height="20" viewBox="0 0 24 24" class="text-green-500">
    <circle cx="12" cy="12" r="${radius}"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      opacity="0.2" />
    <circle cx="12" cy="12" r="${radius}"
      stroke="currentColor"
      stroke-width="2"
      fill="none"
      stroke-dasharray="${circumference}"
      stroke-dashoffset="${strokeDashoffset}"
      transform="rotate(-90 12 12)" />
  </svg>`;
}

// Helper function to create status icon element
export function createStatusIcon(
  type: string,
  redisMatchData: { matches: number; total: number } | undefined,
  columnData: any[]
): { html: string; tooltip: string } {
  let html: string;
  let tooltip: string;

  if (redisMatchData?.matches && redisMatchData.matches > 0) {
    // Show progress ring for Redis matches
    const percentage = (redisMatchData.matches / redisMatchData.total) * 100;
    html = createProgressRing(percentage);
    tooltip = `${redisMatchData.matches} of ${redisMatchData.total} values found in Redis`;
  } else if (type === "integer-numbers" || type === "decimal-numbers") {
    // Show progress ring for numeric types based on valid values
    const percentage = calculateNumericPercentage(columnData, type);
    html = createProgressRing(percentage);
    tooltip = `${Math.round(percentage)}% valid ${
      type === "integer-numbers" ? "integers" : "decimals"
    }`;
  } else if (type === "enum-values") {
    // Show progress ring for enum types
    const percentage = calculateEnumPercentage(columnData);
    html = createProgressRing(percentage);
    tooltip = `${Math.round(percentage)}% consistent enum values`;
  } else if (ACCEPTABLE_TYPES.includes(type)) {
    // Show full progress ring for other acceptable types
    html = createProgressRing(100);
    tooltip = `Identified as ${type}`;
  } else {
    // Show grey question mark for unknown or unsupported types
    html = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
    tooltip = `Unknown or unsupported type: ${type}`;
  }

  return { html, tooltip };
}

export function renderHeader(
  th: HTMLTableCellElement,
  column: number,
  headers: string[],
  identificationStatus: IdentificationStatus | undefined,
  redisStatus: RedisStatus | undefined,
  identifications: Identification | undefined,
  redisMatchData: { matches: number; total: number } | undefined,
  popoverState: PopoverState | null,
  setPopoverState: (state: PopoverState | null) => void,
  columnData: any[]
) {
  if (column < 0) {
    const container = document.createElement("div");
    container.className = "relative";
    container.role = "presentation";
    const textSpan = document.createElement("span");
    textSpan.role = "presentation";
    textSpan.className = "colHeader cornerHeader";
    textSpan.textContent = "\u00A0";
    container.appendChild(textSpan);
    th.appendChild(container);
    return;
  }

  // Create container div
  const container = document.createElement("div");
  container.className = "flex items-center justify-between px-2 py-1";

  // Create text span
  const textSpan = document.createElement("span");
  textSpan.textContent = headers[column] || `Column ${column + 1}`;
  textSpan.className = "pt-1";
  container.appendChild(textSpan);

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "flex items-center gap-1";

  // Add loading indicator or status icon
  if (
    identificationStatus === IdentificationStatus.IDENTIFYING ||
    redisStatus === RedisStatus.MATCHING
  ) {
    const loadingIcon = document.createElement("span");
    loadingIcon.innerHTML =
      '<div class="w-4 h-4"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div></div>';
    loadingIcon.title = "Identifying column type...";
    buttonContainer.appendChild(loadingIcon);
  } else if (identifications) {
    const { html, tooltip } = createStatusIcon(
      identifications.type,
      redisMatchData,
      columnData
    );
    const statusIcon = document.createElement("span");
    statusIcon.innerHTML = html;
    statusIcon.title = tooltip;
    buttonContainer.appendChild(statusIcon);
  }

  // Add menu button
  const menuButton = document.createElement("button");
  menuButton.textContent = "...";
  menuButton.className =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8";
  menuButton.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });
  menuButton.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // If clicking the same column, close it
    if (popoverState?.column === column) {
      setPopoverState(null);
      return;
    }

    // Update position and column
    setPopoverState({
      column,
      rect: {
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
      },
    });
  });

  buttonContainer.appendChild(menuButton);
  container.appendChild(buttonContainer);
  th.appendChild(container);
}
