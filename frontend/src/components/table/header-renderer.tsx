import {
  ColumnIdentification,
  ColumnIdentificationStatus,
  ColumnRedisStatus,
} from "@/stores/table-store";
import { ACCEPTABLE_TYPES } from "@/utils/column-types";

export interface PopoverState {
  column: number;
  rect: { left: number; bottom: number };
}

export function renderHeader(
  th: HTMLTableCellElement,
  column: number,
  headers: string[],
  columnIdentificationStatus: ColumnIdentificationStatus | undefined,
  columnRedisStatus: ColumnRedisStatus | undefined,
  columnIdentifications: ColumnIdentification | undefined,
  columnRedisMatchData: { matches: number; total: number } | undefined,
  popoverState: PopoverState | null,
  setPopoverState: (state: PopoverState | null) => void
) {
  // Create container div
  const container = document.createElement("div");
  container.className = "flex items-center justify-between px-2 py-1";

  // Create text span
  const textSpan = document.createElement("span");
  textSpan.textContent = headers[column] || `Column ${column + 1}`;
  container.appendChild(textSpan);

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "flex items-center gap-1";

  // Add loading indicator or status icon
  if (
    columnIdentificationStatus === ColumnIdentificationStatus.IDENTIFYING ||
    columnRedisStatus === ColumnRedisStatus.MATCHING
  ) {
    const loadingIcon = document.createElement("span");
    loadingIcon.innerHTML =
      '<div class="w-4 h-4"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div></div>';
    loadingIcon.title = "Identifying column type...";
    buttonContainer.appendChild(loadingIcon);
  } else if (columnIdentifications) {
    const type = columnIdentifications.type;
    const statusIcon = document.createElement("span");

    if (columnRedisMatchData?.matches && columnRedisMatchData.matches > 0) {
      // Show green checkmark for Redis matches
      statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>`;
      statusIcon.title = `${columnRedisMatchData.matches} out of ${columnRedisMatchData.total} values found in Redis`;
    } else if (ACCEPTABLE_TYPES.includes(type)) {
      // Show green checkmark for acceptable types
      statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="M20 6L9 17l-5-5"/></svg>`;
      statusIcon.title = `Identified as ${type}`;
    } else {
      // Show red X for unknown or unsupported types
      statusIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
      statusIcon.title = `Unknown or unsupported type: ${type}`;
    }

    buttonContainer.appendChild(statusIcon);
  }

  // Add menu button
  const menuButton = document.createElement("button");
  menuButton.textContent = "...";
  menuButton.className =
    "px-2 py-1 text-xs bg-transparent hover:bg-gray-200 rounded";
  menuButton.addEventListener("pointerdown", (e) => {
    // capture the pointer event before it reaches onPointerDownOutside in
    // PopoverContent
    e.stopPropagation();
  });
  menuButton.addEventListener("mousedown", (e) => {
    // capture the mouse event before it reaches the table
    e.stopPropagation();
  });
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const tableRect =
      th.closest(".handsontable")?.getBoundingClientRect() ?? new DOMRect();

    // If clicking the same column, close it
    if (popoverState?.column === column) {
      setPopoverState(null);
      return;
    }

    // Update position and column
    setPopoverState({
      column,
      rect: {
        left: rect.left - tableRect.left,
        bottom: rect.bottom - tableRect.top,
      },
    });
  });

  buttonContainer.appendChild(menuButton);
  container.appendChild(buttonContainer);
  th.appendChild(container);
}
