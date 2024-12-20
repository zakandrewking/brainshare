import React from "react";

export enum ColumnIdentificationStatus {
  IDENTIFYING = "identifying",
  IDENTIFIED = "identified",
  ERROR = "error",
}

export enum ColumnRedisStatus {
  MATCHING = "matching",
  MATCHED = "matched",
  ERROR = "error",
}

export interface ColumnIdentification {
  type: string;
  description: string;
  suggestedActions?: string[];
}

export interface ColumnStats {
  min: number;
  max: number;
}

export interface ColumnRedisInfo {
  link_prefix: string;
  description: string;
  num_entries: number;
  link: string;
}

export interface TableStore {
  hasHeader: boolean;
  columnIdentifications: Record<number, ColumnIdentification>;
  columnIdentificationStatus: Record<number, ColumnIdentificationStatus>;
  columnRedisStatus: Record<number, ColumnRedisStatus>;
  /**
   * Tracks the Redis match status for each column after type identification.
   * Key: Column index
   * TODO what if we are allowing column reordering?
   * Value: Object containing:
   *   - matches: Number of values found in Redis
   *   - total: Total number of values in the column
   */
  columnRedisMatchData: Record<number, { matches: number; total: number }>;
  columnRedisMatches: Record<number, Set<string>>;
  columnRedisInfo: Record<number, ColumnRedisInfo>;
  columnStats: Record<number, ColumnStats>;
}

export const tableStoreInitialState: TableStore = {
  hasHeader: true,
  columnIdentifications: {},
  columnIdentificationStatus: {},
  columnRedisStatus: {},
  columnRedisMatchData: {},
  columnRedisMatches: {},
  columnRedisInfo: {},
  columnStats: {},
};

interface TableStoreAction {
  type: string;
  payload?: Partial<TableStore>;
}

function reducer(state: TableStore, action: TableStoreAction) {
  if (action.type === "toggleHeader") {
    return { ...state, hasHeader: !state.hasHeader, columnStats: {} };
  } else if (action.type === "setState") {
    const newState = { ...state, ...action.payload };
    console.log("setState", newState);
    return newState;
  } else {
    throw new Error("Invalid action type");
  }
}

const TableStoreContext = React.createContext<{
  state: TableStore;
  dispatch: React.Dispatch<TableStoreAction>;
}>({
  state: tableStoreInitialState,
  dispatch: () => {
    throw new Error("TableStoreProvider not initialized");
  },
});

export function TableStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(reducer, tableStoreInitialState);

  return (
    <TableStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </TableStoreContext.Provider>
  );
}

export function useTableStore() {
  return React.useContext(TableStoreContext);
}
