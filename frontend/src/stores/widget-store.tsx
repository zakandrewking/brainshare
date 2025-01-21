import { create } from "zustand";

export enum WidgetType {
  CHART = "chart",
}

interface Widget {
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
}

interface WidgetActions {
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  setIsSuggestingWidgets: (isSuggestingWidgets: boolean) => void;
}

const initialState = {
  widgets: [],
  newWidgetInfo: {
    count: 2,
    description: "Two new widgets were suggested for you",
  },
  isSuggestingWidgets: false,
};

type WidgetStore = WidgetState & WidgetActions;

export const useWidgetStore = create<WidgetStore>((set) => ({
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
        widgets: [...state.widgets, widget],
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
}));
