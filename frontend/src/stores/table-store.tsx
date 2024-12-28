import React from "react";

import * as R from "remeda";
import { toast } from "sonner";

import { saveTableIdentifications } from "@/actions/table-identification";

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
  // TODO rename and move these. they are actually the user-defined bounds
  absoluteMin?: number;
  absoluteMax?: number;
}

export interface RedisInfo {
  link_prefix: string;
  description: string;
  num_entries: number;
  link: string;
}

export interface TableStoreState {
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
  prefixedId: string | null;
  isSaving: boolean;
}

export const tableStoreInitialState: TableStoreState = {
  hasHeader: true,
  identifications: {},
  identificationStatus: {},
  redisStatus: {},
  redisMatchData: {},
  redisMatches: {},
  redisInfo: {},
  stats: {},
  prefixedId: null,
  isSaving: false,
};

// ---------
// Actions
// ---------

const actions = {
  reset: () => ({ type: "reset" as const }),
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
  setAbsoluteBounds: (
    column: number,
    min: number | undefined,
    max: number | undefined
  ) => ({
    type: "setAbsoluteBounds" as const,
    column,
    min,
    max,
  }),
  setPrefixedId: (prefixedId: string) => ({
    type: "setPrefixedId" as const,
    prefixedId,
  }),
} as const;

export type TableStoreAction = ReturnType<
  (typeof actions)[keyof typeof actions]
>;

// -----
// Persistence
// -----

interface SaveFunnel {
  prefixedId: string;
  state: TableStoreState;
}

// only show one error toast at a time
const errorToastFunnel = R.funnel(
  async function process(error: Error): Promise<void> {
    toast.error("Could not save the table details");
  },
  {
    maxBurstDurationMs: 20_000, // Wait for 20s of burst time
    triggerAt: "start",
    reducer: (_, next: Error) => next, // Always use the latest error
  }
);

// Create a funnel to manage save operations
const saveFunnel = R.funnel(
  async function process({ prefixedId, state }: SaveFunnel): Promise<void> {
    console.log("Saving identifications");
    try {
      await saveTableIdentifications(prefixedId, state);
    } catch (error) {
      console.error("Failed to save identifications:", error);
      errorToastFunnel.call(error as Error);
    }
  },
  {
    maxBurstDurationMs: 3000,
    triggerAt: "end", // Always use the last state
    reducer: (_, next: SaveFunnel) => next, // Always use the latest state
  }
);

// ---------
// Reducer
// ---------

function reducer(state: TableStoreState, action: TableStoreAction) {
  let newState = state;

  switch (action.type) {
    case "reset":
      return tableStoreInitialState;
    case "toggleHeader":
      newState = { ...state, hasHeader: !state.hasHeader, stats: {} };
      break;
    case "setRedisStatus":
      newState = {
        ...state,
        redisStatus: {
          ...state.redisStatus,
          [action.column]: action.status,
        },
      };
      break;
    case "setIdentificationStatus":
      newState = {
        ...state,
        identificationStatus: {
          ...state.identificationStatus,
          [action.column]: action.status,
        },
      };
      break;
    case "setIdentification":
      const currentStats = state.stats[action.column];
      if (
        (action.identification.type === "integer-numbers" ||
          action.identification.type === "decimal-numbers") &&
        currentStats
      ) {
        currentStats.absoluteMin = Math.min(0, currentStats.min);
        currentStats.absoluteMax = currentStats.max;
      }
      newState = {
        ...state,
        identifications: {
          ...state.identifications,
          [action.column]: action.identification,
        },
      };
      break;
    case "setRedisData":
      newState = {
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
      break;
    case "setStats":
      newState = {
        ...state,
        stats: {
          ...state.stats,
          [action.column]: action.stats,
        },
      };
      break;
    case "setAbsoluteBounds":
      const colStats = state.stats[action.column];
      newState = {
        ...state,
        stats: {
          ...state.stats,
          [action.column]: {
            ...colStats,
            absoluteMin: action.min,
            absoluteMax: action.max,
          },
        },
      };
      break;
    case "setPrefixedId":
      newState = {
        ...state,
        prefixedId: action.prefixedId,
      };
      break;
    default:
      throw new Error("Invalid action type");
  }

  // Save state to database if we have a prefixedId
  if (state.prefixedId) {
    saveFunnel.call({ prefixedId: state.prefixedId, state: newState });
  }

  return newState;
}

// ---------
// Context
// ---------

const TableStoreContext = React.createContext<{
  state: TableStoreState;
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
