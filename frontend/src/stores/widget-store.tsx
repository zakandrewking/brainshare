import { createSelectorHooks } from "auto-zustand-selectors-hook";
import { create } from "zustand";

export enum WidgetType {
  CHART = "chart",
}

export interface Widget {
  type: WidgetType;
  name: string;
  description: string;
  vegaLiteSpec?: Record<string, any>;
  isSuggested: boolean;
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
}

interface WidgetActions {
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => void;
  setSidebarOpen: (sidebarOpen: boolean) => void;
  reset: () => void;
}

const initialState = {
  widgets: [],
  newWidgetInfo: {
    count: 2,
    description: "Two new widgets were suggested for you",
  },
  isSuggestingWidgets: false,
  sidebarOpen: false,
};

type WidgetStore = WidgetState & WidgetActions;

const useWidgetStoreBase = create<WidgetStore>((set) => ({
  ...initialState,
  addWidget: (widget: Widget) => {
    set((state) => {
      if (state.widgets.some((w) => w.name === widget.name)) {
        console.warn("Widget already exists");
        return {
          widgets: [...state.widgets],
        };
      }
      return {
        widgets: [widget, ...state.widgets],
      };
    });
  },
  removeWidget: (name: string) => {
    set((state) => ({
      widgets: state.widgets.filter((widget) => widget.name !== name),
    }));
  },
  setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => {
    set((_) => ({
      isSuggestingWidgets,
    }));
  },
  setSidebarOpen: (sidebarOpen: boolean) => {
    set((_) => ({
      sidebarOpen,
    }));
  },
  reset: () => {
    set(initialState);
  },
}));

export const widgetStoreHooks = createSelectorHooks(useWidgetStoreBase);
