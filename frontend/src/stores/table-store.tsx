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

const actions = {
  toggleHeader: () => ({ type: "toggleHeader" as const }),
  setColumnRedisStatus: (column: number, status: ColumnRedisStatus) => ({
    type: "setColumnRedisStatus" as const,
    column,
    status,
  }),
  setColumnIdentificationStatus: (
    column: number,
    status: ColumnIdentificationStatus
  ) => ({
    type: "setColumnIdentificationStatus" as const,
    column,
    status,
  }),
  setColumnIdentification: (
    column: number,
    identification: ColumnIdentification
  ) => ({
    type: "setColumnIdentification" as const,
    column,
    identification,
  }),
  setColumnRedisData: (
    column: number,
    data: {
      redisStatus: ColumnRedisStatus;
      matchData?: { matches: number; total: number };
      matches?: Set<string>;
      info?: ColumnRedisInfo;
    }
  ) => ({
    type: "setColumnRedisData" as const,
    column,
    data,
  }),
  setColumnStats: (column: number, stats: ColumnStats) => ({
    type: "setColumnStats" as const,
    column,
    stats,
  }),
} as const;

export type TableStoreAction = ReturnType<
  (typeof actions)[keyof typeof actions]
>;

function reducer(state: TableStore, action: TableStoreAction) {
  switch (action.type) {
    case "toggleHeader":
      return { ...state, hasHeader: !state.hasHeader, columnStats: {} };
    case "setColumnRedisStatus":
      return {
        ...state,
        columnRedisStatus: {
          ...state.columnRedisStatus,
          [action.column]: action.status,
        },
      };
    case "setColumnIdentificationStatus":
      return {
        ...state,
        columnIdentificationStatus: {
          ...state.columnIdentificationStatus,
          [action.column]: action.status,
        },
      };
    case "setColumnIdentification":
      return {
        ...state,
        columnIdentifications: {
          ...state.columnIdentifications,
          [action.column]: action.identification,
        },
      };
    case "setColumnRedisData":
      return {
        ...state,
        columnRedisStatus: {
          ...state.columnRedisStatus,
          [action.column]: action.data.redisStatus,
        },
        ...(action.data.matchData && {
          columnRedisMatchData: {
            ...state.columnRedisMatchData,
            [action.column]: action.data.matchData,
          },
        }),
        ...(action.data.matches && {
          columnRedisMatches: {
            ...state.columnRedisMatches,
            [action.column]: action.data.matches,
          },
        }),
        ...(action.data.info && {
          columnRedisInfo: {
            ...state.columnRedisInfo,
            [action.column]: action.data.info,
          },
        }),
      };
    case "setColumnStats":
      return {
        ...state,
        columnStats: {
          ...state.columnStats,
          [action.column]: action.stats,
        },
      };
    default:
      throw new Error("Invalid action type");
  }
}

const TableStoreContext = React.createContext<{
  state: TableStore;
  dispatch: React.Dispatch<TableStoreAction>;
  actions: typeof actions;
}>({
  state: tableStoreInitialState,
  dispatch: () => {
    throw new Error("TableStoreProvider not initialized");
  },
  actions: actions,
});

export function TableStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(reducer, tableStoreInitialState);

  return (
    <TableStoreContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </TableStoreContext.Provider>
  );
}

export function useTableStore() {
  return React.useContext(TableStoreContext);
}
