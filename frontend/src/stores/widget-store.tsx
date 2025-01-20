import { create } from "zustand";

export enum WidgetType {
  CHART = "chart",
}

interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  isSuggested: boolean;
}

interface NewWidgetInfo {
  count: number;
  description: string;
}

interface WidgetState {
  widgets: Widget[];
  newWidgetInfo: NewWidgetInfo;
}

interface WidgetActions {
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
}

const initialState = {
  widgets: [
    {
      id: "2",
      type: WidgetType.CHART,
      name: "Chart",
      description: "A chart widget",
      isSuggested: true,
    },
    {
      id: "3",
      type: WidgetType.CHART,
      name: "Chart",
      description: "A chart widget",
      isSuggested: false,
    },
  ],
  newWidgetInfo: {
    count: 2,
    description: "Two new widgets were suggested for you",
  },
};

type WidgetStore = WidgetState & WidgetActions;

export const useWidgetStore = create<WidgetStore>((set) => ({
  ...initialState,
  addWidget: (widget: Widget) => {
    set((state) => ({
      widgets: [...state.widgets, widget],
    }));
  },
  removeWidget: (id: string) => {
    set((state) => ({
      widgets: state.widgets.filter((widget) => widget.id !== id),
    }));
  },
}));
