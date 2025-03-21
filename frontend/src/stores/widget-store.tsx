"use client";

import React from "react";

import { createSelectorHooks } from "auto-zustand-selectors-hook";
import * as R from "remeda";
import { toast } from "sonner";
import {
  createStore,
  StoreApi,
  useStore,
} from "zustand";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";

import { User } from "@supabase/supabase-js";

import {
  loadTableWidgets,
  loadWidgetPreferences,
  saveTableWidgets,
  saveWidgetPreferences,
} from "@/actions/table-widgets";

import {
  LoadingState,
  type LoadingStateBase,
  type LoadingStateBaseLoaded,
  type LoadingStateBaseUnloaded,
} from "./store-loading";

// -----
// Types
// -----

// data types

export interface Widget {
  id?: string;
  engine: WidgetEngine;
  type: string;
  name: string;
  description: string;
  vegaLiteSpec?: Record<string, any>;
  observablePlotCode?: string;
  isSuggested: boolean;
  displayOrder?: number;
}

export type WidgetEngine = "vega-lite" | "observable-plot";

export interface WidgetDataState {
  widgets: Widget[];
  sidebarOpen: boolean;
  activeEngine: WidgetEngine;
}

const initialData: WidgetDataState = {
  widgets: [],
  sidebarOpen: false,
  activeEngine: "vega-lite",
};

// action types

interface WidgetActions {
  reset: () => void;
  loadWithPrefixedId: (prefixedId: string) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (name: string) => void;
  setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  setActiveEngine: (activeEngine: WidgetEngine) => void;
}

type WidgetState = LoadingStateBase<WidgetDataState>;

type WidgetStore = WidgetState & WidgetActions;

// -----------
// Persistence
// -----------

// Saving

// only show one error toast at a time
const errorToastFunnel = R.funnel(
  async function process(_: Error): Promise<void> {
    toast.error("Could not save the widgets");
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
  }: LoadingStateBaseLoaded<WidgetDataState>): Promise<void> {
    console.log("Saving widgets");

    try {
      await saveTableWidgets(prefixedId, data);
      await saveWidgetPreferences(prefixedId, data.activeEngine as string);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Not authenticated")
      ) {
        console.log("Not logged in; not saving");
        return;
      }
      console.error("Failed to save widgets:", error);
      errorToastFunnel.call(error as Error);
    }
  },
  {
    maxBurstDurationMs: 3000,
    triggerAt: "end", // Always use the last state
    reducer: (_, next: LoadingStateBaseLoaded<WidgetDataState>) => next, // Always use the latest state
  }
);

// Loading

const WidgetStoreContext = React.createContext<StoreApi<WidgetStore> | null>(
  null
);

const initialState: LoadingStateBaseUnloaded<WidgetDataState> = {
  loadingState: LoadingState.UNLOADED,
};

export const WidgetStoreProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) => {
  const [store] = React.useState(() =>
    createStore<WidgetStore>()(
      immer((set, get) => ({
        ...initialState,

        reset: () => set(initialState),

        loadWithPrefixedId: (prefixedId: string) => {
          const loadWidgetsAndPreferences = async () => {
            console.log("Loading widgets and preferences");
            try {
              const widgets = await loadTableWidgets(prefixedId);
              const preferences = await loadWidgetPreferences(prefixedId);

              if (widgets) {
                console.log("Widgets loaded");
                set({
                  loadingState: LoadingState.LOADED,
                  prefixedId,
                  data: {
                    ...initialData,
                    widgets: widgets.widgets.map((w) => ({
                      ...w,
                      engine: w.engine as WidgetEngine,
                    })),
                    activeEngine:
                      (preferences?.activeEngine as WidgetEngine) ||
                      initialData.activeEngine,
                  },
                });
              } else {
                console.log("No widgets found");
                set({
                  loadingState: LoadingState.LOADED,
                  prefixedId,
                  data: initialData,
                });
              }
            } catch (error) {
              console.error("Failed to load widgets and preferences:", error);
              set({
                loadingState: LoadingState.ERROR,
                error: error as Error,
              });
            }
          };

          set({ loadingState: LoadingState.LOADING });
          loadWidgetsAndPreferences();
        },

        addWidget: (widget: Widget) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded in addWidget");
            }
            state.data.widgets.unshift(widget);
          }),

        removeWidget: (name: string) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded in removeWidget");
            }
            state.data.widgets = state.data.widgets.filter(
              (w) => w.name !== name
            );
          }),

        setIsSuggestingWidgets: (isSuggestingWidgets: boolean) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded in setIsSuggestingWidgets");
            }
            state.data.widgets.forEach((w) => {
              w.isSuggested = isSuggestingWidgets;
            });
          }),

        setSidebarOpen: (sidebarOpen: boolean) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded in setSidebarOpen");
            }
            state.data.sidebarOpen = sidebarOpen;
          }),

        setActiveEngine: (activeEngine: WidgetEngine) =>
          set((state) => {
            if (state.loadingState !== LoadingState.LOADED) {
              throw new Error("Data not loaded in setActiveEngine");
            }
            state.data.activeEngine = activeEngine;
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
    <WidgetStoreContext.Provider value={store}>
      {children}
    </WidgetStoreContext.Provider>
  );
};

export const useWidgetStoreHooks = () => {
  const store = React.useContext(WidgetStoreContext);
  if (!store) {
    // OK to throw here because store is generated synchronously
    throw new Error("WidgetStoreProvider not found");
  }
  return {
    ...createSelectorHooks(store),

    // TODO extend createSelectorHooks to create hooks for data.*

    useWidgets: () =>
      useStore(
        store,
        useShallow((state) => state.data?.widgets)
      ),

    useSidebarOpen: () =>
      useStore(
        store,
        useShallow((state) => state.data?.sidebarOpen)
      ),

    useActiveEngine: () =>
      useStore(
        store,
        useShallow((state) => state.data?.activeEngine)
      ),
  };
};
