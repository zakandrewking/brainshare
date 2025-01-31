"use client";

import React from "react";

import { createSelectorHooks } from "auto-zustand-selectors-hook";
import {
  createStore,
  StoreApi,
} from "zustand";

import { User } from "@supabase/supabase-js";

export enum WidgetType {
  CHART = "chart",
}

export interface Widget {
  id?: string;
  type: WidgetType;
  name: string;
  description: string;
  vegaLiteSpec?: Record<string, any>;
  isSuggested: boolean;
  displayOrder?: number;
}

interface NewWidgetInfo {
  count: number;
  description: string;
}

interface WidgetState {
  widgets: Widget[];
  newWidgetInfo: NewWidgetInfo;
  isSuggestingWidgets: boolean;
  sidebarOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface WidgetActions {
  addWidget: (widget: Widget) => Promise<void>;
  removeWidget: (name: string) => Promise<void>;
  setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  // loadWidgets: () => Promise<void>;
  reset: () => void;
}

const initialState: WidgetState = {
  widgets: [],
  newWidgetInfo: {
    count: 2,
    description: "Two new widgets were suggested for you",
  },
  isSuggestingWidgets: false,
  sidebarOpen: false,
  isLoading: true,
  error: null,
};

type WidgetStore = WidgetState & WidgetActions;

const WidgetStoreContext = React.createContext<StoreApi<WidgetStore> | null>(
  null
);

export const WidgetStoreProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) => {
  const [store] = React.useState(() =>
    createStore<WidgetStore>((set) => {
      return {
        ...initialState,

        // loadWidgets: async () => {
        //   if (!user) return;

        //   try {
        //     const { data: widgets, error } = await supabase
        //       .from("widget")
        //       .select("*")
        //       .order("display_order", { ascending: true });

        //     if (error) throw error;

        //     set({
        //       widgets: widgets.map((w) => ({
        //         id: w.id,
        //         type: w.type as WidgetType,
        //         name: w.name,
        //         description: w.description,
        //         vegaLiteSpec: w.vega_lite_spec,
        //         isSuggested: w.is_suggested,
        //         displayOrder: w.display_order,
        //       })),
        //       isLoading: false,
        //       error: null,
        //     });
        //   } catch (error) {
        //     console.error("Error loading widgets:", error);
        //     set({ error: "Failed to load widgets", isLoading: false });
        //   }
        // },

        addWidget: async (widget: Widget) => {
          // if (!user) return;

          // try {
          //   const state = get();
          //   if (state.widgets.some((w) => w.name === widget.name)) {
          //     console.warn("Widget already exists");
          //     return;
          //   }

          //   const displayOrder =
          //     state.widgets.length > 0
          //       ? Math.min(...state.widgets.map((w) => w.displayOrder ?? 0)) - 1
          //       : 0;

          //   const { data: newWidget, error } = await supabase
          //     .from("widget")
          //     .insert({
          //       type: widget.type,
          //       name: widget.name,
          //       description: widget.description,
          //       vega_lite_spec: widget.vegaLiteSpec,
          //       is_suggested: widget.isSuggested,
          //       display_order: displayOrder,
          //     })
          //     .select()
          //     .single();

          //   if (error) throw error;
          set((state) => ({
            widgets: [widget, ...state.widgets],
            error: null,
          }));
          // } catch (error) {
          //   console.error("Error adding widget:", error);
          //   set({ error: "Failed to add widget" });
          // }
        },

        removeWidget: async (name: string) => {
          // if (!user) return;

          // try {
          //   const widget = get().widgets.find((w) => w.name === name);
          //   if (!widget?.id) return;

          //   const { error } = await supabase
          //     .from("widget")
          //     .delete()
          //     .eq("id", widget.id);

          //   if (error) throw error;

          set((state) => ({
            widgets: state.widgets.filter((w) => w.name !== name),
            error: null,
          }));
          // } catch (error) {
          //   console.error("Error removing widget:", error);
          //   set({ error: "Failed to remove widget" });
          // }
        },

        setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => {
          set({ isSuggestingWidgets });
        },

        setSidebarOpen: (sidebarOpen: boolean) => {
          set({ sidebarOpen });
        },

        reset: () => {
          set(initialState);
        },
      };
    })
  );

  // // Load widgets when the store is mounted and user changes
  // React.useEffect(() => {
  //   store.getState().loadWidgets();
  // }, [store, user]);

  return (
    <WidgetStoreContext.Provider value={store}>
      {children}
    </WidgetStoreContext.Provider>
  );
};

export const useWidgetStoreHooks = () => {
  const store = React.useContext(WidgetStoreContext);
  if (!store) {
    throw new Error("WidgetStoreProvider not found");
  }
  return createSelectorHooks(store);
};
