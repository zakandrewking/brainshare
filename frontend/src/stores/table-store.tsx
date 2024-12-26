import React from "react";

// -----
// Types
// -----

export enum IdentificationStatus {
  IDENTIFYING = "identifying",
  IDENTIFIED = "identified",
  ERROR = "error",
}

export enum RedisStatus {
  MATCHING = "matching",
  MATCHED = "matched",
  ERROR = "error",
}

export interface Identification {
  type: string;
  description: string;
  suggestedActions?: string[];
}

export interface Stats {
  min: number;
  max: number;
}

export interface RedisInfo {
  link_prefix: string;
  description: string;
  num_entries: number;
  link: string;
}

export interface TableStore {
  hasHeader: boolean;
  identifications: Record<number, Identification>;
  identificationStatus: Record<number, IdentificationStatus>;
  redisStatus: Record<number, RedisStatus>;
  /**
   * Tracks the Redis match status for each column after type identification.
   * Key: Column index
   * TODO what if we are allowing column reordering?
   * Value: Object containing:
   *   - matches: Number of values found in Redis
   *   - total: Total number of values in the column
   */
  redisMatchData: Record<number, { matches: number; total: number }>;
  redisMatches: Record<number, Set<string>>;
  redisInfo: Record<number, RedisInfo>;
  stats: Record<number, Stats>;
}

export const tableStoreInitialState: TableStore = {
  hasHeader: true,
  identifications: {},
  identificationStatus: {},
  redisStatus: {},
  redisMatchData: {},
  redisMatches: {},
  redisInfo: {},
  stats: {},
};

// ---------
// Actions
// ---------

const actions = {
  toggleHeader: () => ({ type: "toggleHeader" as const }),
  setRedisStatus: (column: number, status: RedisStatus) => ({
    type: "setRedisStatus" as const,
    column,
    status,
  }),
  setIdentificationStatus: (column: number, status: IdentificationStatus) => ({
    type: "setIdentificationStatus" as const,
    column,
    status,
  }),
  setIdentification: (column: number, identification: Identification) => ({
    type: "setIdentification" as const,
    column,
    identification,
  }),
  setRedisData: (
    column: number,
    data: {
      redisStatus: RedisStatus;
      matchData?: { matches: number; total: number };
      matches?: Set<string>;
      info?: RedisInfo;
    }
  ) => ({
    type: "setRedisData" as const,
    column,
    data,
  }),
  setStats: (column: number, stats: Stats) => ({
    type: "setStats" as const,
    column,
    stats,
  }),
} as const;

export type TableStoreAction = ReturnType<
  (typeof actions)[keyof typeof actions]
>;

// ---------
// Reducer
// ---------

function reducer(state: TableStore, action: TableStoreAction) {
  switch (action.type) {
    case "toggleHeader":
      return { ...state, hasHeader: !state.hasHeader, stats: {} };
    case "setRedisStatus":
      return {
        ...state,
        redisStatus: {
          ...state.redisStatus,
          [action.column]: action.status,
        },
      };
    case "setIdentificationStatus":
      return {
        ...state,
        identificationStatus: {
          ...state.identificationStatus,
          [action.column]: action.status,
        },
      };
    case "setIdentification":
      return {
        ...state,
        identifications: {
          ...state.identifications,
          [action.column]: action.identification,
        },
      };
    case "setRedisData":
      return {
        ...state,
        redisStatus: {
          ...state.redisStatus,
          [action.column]: action.data.redisStatus,
        },
        ...(action.data.matchData && {
          redisMatchData: {
            ...state.redisMatchData,
            [action.column]: action.data.matchData,
          },
        }),
        ...(action.data.matches && {
          redisMatches: {
            ...state.redisMatches,
            [action.column]: action.data.matches,
          },
        }),
        ...(action.data.info && {
          redisInfo: {
            ...state.redisInfo,
            [action.column]: action.data.info,
          },
        }),
      };
    case "setStats":
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.column]: action.stats,
        },
      };
    default:
      throw new Error("Invalid action type");
  }
}

// ---------
// Context
// ---------

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
