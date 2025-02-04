"use client";

import React from "react";

import { createSelectorHooks } from "auto-zustand-selectors-hook";
import * as R from "remeda";
import { toast } from "sonner";
import { createStore, StoreApi, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";

import { User } from "@supabase/supabase-js";

import {
  loadTableIdentifications,
  saveTableIdentifications,
} from "@/actions/table-identification";

import {
  loadDataByPrefixedId,
  LoadingState,
  type LoadingStateBase,
  type LoadingStateBaseLoaded,
  type LoadingStateBaseUnloaded,
} from "./store-loading";

// -----
// Types
// -----

// data types

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

export interface IdentificationDataState {
  // Whether the table has a header
  hasHeader: boolean;

  // The identifications for each column
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
  isSaving: boolean;
  activeFilters: FilterState[];
  isIdentifying: boolean;
}

const initialData: IdentificationDataState = {
  hasHeader: false,
  identifications: {},
  identificationStatus: {},
  redisStatus: {},
  redisMatchData: {},
  redisMatches: {},
  redisInfo: {},
  stats: {},
  typeOptions: {},
  isSaving: false,
  activeFilters: [],
  isIdentifying: false,
};

// action types

interface IdentificationActions {
  reset: () => void;
  loadWithPrefixedId: (prefixedId: string) => void;
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
  setOptionMin: (column: number, min: number | null) => void;
  setOptionMax: (column: number, max: number | null) => void;
  setOptionLogarithmic: (column: number, logarithmic: boolean) => void;
  addFilter: (column: number, type: FilterState["type"]) => void;
  removeFilter: (column: number) => void;
  clearFilters: () => void;
  setIsIdentifying: (isIdentifying: boolean) => void;
}

type IdentificationState = LoadingStateBase<IdentificationDataState>;

export type IdentificationStore = IdentificationState & IdentificationActions;

// -----------
// Persistence
// -----------

// Saving

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
  async function process({
    prefixedId,
    data,
  }: LoadingStateBaseLoaded<IdentificationDataState>): Promise<void> {
    console.log("Saving identifications");

    try {
      await saveTableIdentifications(prefixedId, data);
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
    reducer: (_, next: LoadingStateBaseLoaded<IdentificationDataState>) => next, // Always use the latest state
  }
);

// -----
// Store
// -----

const IdentificationStoreContext =
  React.createContext<StoreApi<IdentificationStore> | null>(null);

const initialState: LoadingStateBaseUnloaded<IdentificationDataState> = {
  loadingState: LoadingState.UNLOADED,
};

export const IdentificationStoreProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) => {
  const [store] = React.useState(() =>
    createStore<IdentificationStore>()(
      immer((set, get) => ({
        ...initialState,

        reset: () => set(initialState),

        loadWithPrefixedId: async (prefixedId: string) =>
          loadDataByPrefixedId(
            set,
            get,
            prefixedId,
            loadTableIdentifications,
            initialData,
            "identificationStore"
          ),

        toggleHeader: () => {
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.hasHeader = !state.data.hasHeader;
            state.data.stats = {};
          });
        },

        setRedisStatus: (column: number, status: RedisStatus) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.redisStatus[column] = status;
          }),

        setIdentificationStatus: (
          column: number,
          status: IdentificationStatus
        ) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.identificationStatus[column] = status;
          }),

        setIdentification: (column: number, identification: Identification) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.identifications[column] = identification;
          }),

        setRedisData: (
          column: number,
          data: {
            matchData?: { matches: number; total: number };
            matches?: string[];
            info?: RedisInfo;
          }
        ) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            if (data.matchData) {
              state.data.redisMatchData[column] = data.matchData;
            }
            if (data.matches) {
              state.data.redisMatches[column] = data.matches;
            }
            if (data.info) {
              state.data.redisInfo[column] = data.info;
            }
          }),

        setStats: (column: number, stats: Stats) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.stats[column] = stats;
          }),

        setOptionMin: (column: number, min: number | null) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            if (
              min === Infinity ||
              min === -Infinity ||
              (min !== null && isNaN(min))
            ) {
              throw new Error(`Invalid min value: ${min}`);
            }
            state.data.typeOptions[column] = {
              min,
              max: state.data.typeOptions[column]?.max ?? null,
              logarithmic: state.data.typeOptions[column]?.logarithmic ?? false,
            };
          }),

        setOptionMax: (column: number, max: number | null) => {
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            if (
              max === Infinity ||
              max === -Infinity ||
              (max !== null && isNaN(max))
            ) {
              throw new Error(`Invalid max value: ${max}`);
            }
            state.data.typeOptions[column] = {
              min: state.data.typeOptions[column]?.min ?? null,
              max,
              logarithmic: state.data.typeOptions[column]?.logarithmic ?? false,
            };
          });
        },

        setOptionLogarithmic: (column: number, logarithmic: boolean) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.typeOptions[column] = {
              min: state.data.typeOptions[column]?.min ?? null,
              max: state.data.typeOptions[column]?.max ?? null,
              logarithmic,
            };
          }),

        addFilter: (column: number, type: FilterState["type"]) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.activeFilters = [
              ...state.data.activeFilters.filter((f) => f.column !== column),
              { column, type },
            ];
          }),

        removeFilter: (column: number) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.activeFilters = state.data.activeFilters.filter(
              (f) => f.column !== column
            );
          }),

        clearFilters: () =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.activeFilters = [];
          }),

        setIsIdentifying: (isIdentifying: boolean) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded");
            }
            state.data.isIdentifying = isIdentifying;
          }),
      }))
    )
  );

  // Effect: save state to DB when a user & prefixedId are specified
  React.useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      unsubscribe = store.subscribe((state) => {
        if (state.loadingState === LoadingState.LOADED) {
          saveFunnel.call(state);
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
  return {
    ...createSelectorHooks(store),

    // TODO extend createSelectorHooks to create hooks for data.*

    useHasHeader: useStore(
      store,
      useShallow((state) => state.data?.hasHeader)
    ),
    useIdentifications: () =>
      useStore(
        store,
        useShallow((state) => state.data?.identifications)
      ),
    useIdentificationStatus: () =>
      useStore(
        store,
        useShallow((state) => state.data?.identificationStatus)
      ),
    useRedisStatus: () =>
      useStore(
        store,
        useShallow((state) => state.data?.redisStatus)
      ),
    useRedisMatchData: () =>
      useStore(
        store,
        useShallow((state) => state.data?.redisMatchData)
      ),
    useRedisMatches: () =>
      useStore(
        store,
        useShallow((state) => state.data?.redisMatches)
      ),
    useRedisInfo: () =>
      useStore(
        store,
        useShallow((state) => state.data?.redisInfo)
      ),
    useStats: () =>
      useStore(
        store,
        useShallow((state) => state.data?.stats)
      ),
    useTypeOptions: () =>
      useStore(
        store,
        useShallow((state) => state.data?.typeOptions)
      ),
    useIsSaving: () =>
      useStore(
        store,
        useShallow((state) => state.data?.isSaving)
      ),
    useActiveFilters: () =>
      useStore(
        store,
        useShallow((state) => state.data?.activeFilters)
      ),
    useIsIdentifying: () =>
      useStore(
        store,
        useShallow((state) => state.data?.isIdentifying)
      ),
  };
};
