"use client";

import React from "react";

import { createSelectorHooks } from "auto-zustand-selectors-hook";
import * as R from "remeda";
import { toast } from "sonner";
import {
  createStore,
  StoreApi,
} from "zustand";

import { User } from "@supabase/supabase-js";

import { saveTableIdentifications } from "@/actions/table-identification";

// -----
// Types
// -----

export enum IdentificationStatus {
  IDENTIFYING = "identifying",
  IDENTIFIED = "identified",
  DELETED = "deleted",
  ERROR = "error",
}

export enum RedisStatus {
  MATCHING = "matching",
  MATCHED = "matched",
  ERROR = "error",
}

export interface Identification {
  type: string; // "unknown-type" is a special type that indicates that the column could not be identified
  description: string;
  suggestedActions?: string[];
  is_custom: boolean;
  id?: string;
  name?: string;
  kind?: string;
  min_value?: number;
  max_value?: number;
  log_scale?: boolean;
}

export interface Stats {
  min: number;
  max: number;
}

export interface TypeOptions {
  min: number | null;
  max: number | null;
  logarithmic: boolean;
}

export interface RedisInfo {
  link_prefix: string;
  description: string;
  num_entries: number;
  link: string;
}

export interface FilterState {
  column: number;
  type: "valid-only" | "invalid-only";
}

export interface IdentificationState {
  hasHeader: boolean;
  identifications: {
    [column: number]: Identification;
  };
  identificationStatus: {
    [column: number]: IdentificationStatus;
  };
  redisStatus: {
    [column: number]: RedisStatus;
  };
  redisMatchData: Record<number, { matches: number; total: number }>;
  redisMatches: Record<number, string[]>;
  redisInfo: Record<number, RedisInfo>;
  stats: Record<number, Stats>;
  typeOptions: Record<number, TypeOptions>;
  prefixedId: string | null;
  isSaving: boolean;
  activeFilters: FilterState[];
}

interface IdentificationActions {
  reset: () => void;
  toggleHeader: () => void;
  setRedisStatus: (column: number, status: RedisStatus) => void;
  setIdentificationStatus: (
    column: number,
    status: IdentificationStatus
  ) => void;
  setIdentification: (column: number, identification: Identification) => void;
  setRedisData: (
    column: number,
    data: {
      redisStatus: RedisStatus;
      matchData?: { matches: number; total: number };
      matches?: string[];
      info?: RedisInfo;
    }
  ) => void;
  setStats: (column: number, stats: Stats) => void;
  setPrefixedId: (prefixedId: string) => void;
  setOptionMin: (column: number, min: number | null) => void;
  setOptionMax: (column: number, max: number | null) => void;
  setOptionLogarithmic: (column: number, logarithmic: boolean) => void;
  addFilter: (column: number, type: FilterState["type"]) => void;
  removeFilter: (column: number) => void;
  clearFilters: () => void;
}

export type IdentificationStore = IdentificationState & IdentificationActions;

// -----
// Persistence
// -----

interface SaveFunnel {
  prefixedId: string;
  state: IdentificationState;
}

// only show one error toast at a time
const errorToastFunnel = R.funnel(
  async function process(_: Error): Promise<void> {
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
      if (
        error instanceof Error &&
        error.message.includes("Not authenticated")
      ) {
        console.log("Not logged in; not saving");
        return;
      }
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

// -----
// Store
// -----

const initialState: IdentificationState = {
  hasHeader: true,
  identifications: {},
  identificationStatus: {},
  redisStatus: {},
  redisMatchData: {},
  redisMatches: {},
  redisInfo: {},
  stats: {},
  typeOptions: {},
  prefixedId: null,
  isSaving: false,
  activeFilters: [],
};

const IdentificationStoreContext =
  React.createContext<StoreApi<IdentificationStore> | null>(null);

export const IdentificationStoreProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) => {
  const [store] = React.useState(() =>
    createStore<IdentificationStore>((set) => ({
      ...initialState,

      reset: () => set(initialState),

      toggleHeader: () =>
        set((state) => ({
          hasHeader: !state.hasHeader,
          stats: {},
        })),

      setRedisStatus: (column: number, status: RedisStatus) =>
        set((state) => ({
          redisStatus: {
            ...state.redisStatus,
            [column]: status,
          },
        })),

      setIdentificationStatus: (column: number, status: IdentificationStatus) =>
        set((state) => ({
          identificationStatus: {
            ...state.identificationStatus,
            [column]: status,
          },
        })),

      setIdentification: (column: number, identification: Identification) =>
        set((state) => ({
          identifications: {
            ...state.identifications,
            [column]: identification,
          },
        })),

      setRedisData: (
        column: number,
        data: {
          matchData?: { matches: number; total: number };
          matches?: string[];
          info?: RedisInfo;
        }
      ) =>
        set((state) => {
          const newState = {
            redisMatchData: { ...state.redisMatchData },
            redisMatches: { ...state.redisMatches },
            redisInfo: { ...state.redisInfo },
          };

          if (data.matchData) {
            newState.redisMatchData[column] = data.matchData;
          }
          if (data.matches) {
            newState.redisMatches[column] = data.matches;
          }
          if (data.info) {
            newState.redisInfo[column] = data.info;
          }

          return newState;
        }),

      setStats: (column: number, stats: Stats) =>
        set((state) => ({
          stats: {
            ...state.stats,
            [column]: stats,
          },
        })),

      setPrefixedId: (prefixedId: string) =>
        set((_) => ({
          prefixedId,
        })),

      setOptionMin: (column: number, min: number | null) =>
        set((state) => {
          if (
            min === Infinity ||
            min === -Infinity ||
            (min !== null && isNaN(min))
          ) {
            throw new Error(`Invalid min value: ${min}`);
          }
          return {
            typeOptions: {
              ...state.typeOptions,
              [column]: {
                min,
                max: state.typeOptions[column]?.max ?? null,
                logarithmic: state.typeOptions[column]?.logarithmic ?? false,
              },
            },
          };
        }),

      setOptionMax: (column: number, max: number | null) =>
        set((state) => {
          if (
            max === Infinity ||
            max === -Infinity ||
            (max !== null && isNaN(max))
          ) {
            throw new Error(`Invalid max value: ${max}`);
          }
          return {
            typeOptions: {
              ...state.typeOptions,
              [column]: {
                min: state.typeOptions[column]?.min ?? null,
                max,
                logarithmic: state.typeOptions[column]?.logarithmic ?? false,
              },
            },
          };
        }),

      setOptionLogarithmic: (column: number, logarithmic: boolean) =>
        set((state) => ({
          typeOptions: {
            ...state.typeOptions,
            [column]: {
              min: state.typeOptions[column]?.min ?? null,
              max: state.typeOptions[column]?.max ?? null,
              logarithmic,
            },
          },
        })),

      addFilter: (column: number, type: FilterState["type"]) =>
        set((state) => ({
          activeFilters: [
            ...state.activeFilters.filter((f) => f.column !== column),
            { column, type },
          ],
        })),

      removeFilter: (column: number) =>
        set((state) => ({
          activeFilters: state.activeFilters.filter((f) => f.column !== column),
        })),

      clearFilters: () =>
        set((_) => ({
          activeFilters: [],
        })),
    }))
  );

  React.useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      unsubscribe = store.subscribe((state) => {
        if (state.prefixedId) {
          saveFunnel.call({ prefixedId: state.prefixedId, state });
        }
      });
    }
    return () => {
      unsubscribe?.();
    };
  }, [store, user]);

  return (
    <IdentificationStoreContext.Provider value={store}>
      {children}
    </IdentificationStoreContext.Provider>
  );
};

export const useIdentificationStoreHooks = () => {
  const store = React.useContext(IdentificationStoreContext);
  if (!store) {
    throw new Error("IdentificationStoreProvider not found");
  }
  return createSelectorHooks(store);
};
