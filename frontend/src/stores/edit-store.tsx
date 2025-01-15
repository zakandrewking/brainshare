import React from "react";

import { applyEdits } from "@/utils/tables";

// state

export type Edit =
  | { edit: "deleteRow"; row: number }
  | { edit: "deleteColumn"; column: number }
  | { edit: "edit"; column?: number; row?: number; value?: string };

interface EditStoreState {
  rawData: string | null;
  headers: string[] | null;
  parsedData: string[][];
  filteredData: string[][];
  edits: Edit[];
}

const editStoreInitialState: EditStoreState = {
  rawData: "",
  headers: [],
  parsedData: [],
  filteredData: [],
  edits: [],
};

// actions

export const actions = {
  setHeaders: (headers: string[]) => ({
    type: "setHeaders" as const,
    headers,
  }),
  setParsedData: (parsedData: string[][]) => ({
    type: "setParsedData" as const,
    parsedData,
  }),
  setFilteredData: (filteredData: string[][]) => ({
    type: "setFilteredData" as const,
    filteredData,
  }),
  deleteRow: (row: number) => ({
    type: "deleteRow" as const,
    row,
  }),
  deleteColumn: (column: number) => ({
    type: "deleteColumn" as const,
    column,
  }),
} as const;

export type EditStoreActions = typeof actions;
export type EditStoreAction = ReturnType<
  EditStoreActions[keyof EditStoreActions]
>;

// reducer

function reducer(state: EditStoreState, action: EditStoreAction) {
  let newState = state;
  switch (action.type) {
    case "setHeaders":
      newState = {
        ...state,
        headers: action.headers,
      };
      break;
    case "setParsedData":
      newState = {
        ...state,
        parsedData: action.parsedData,
      };
      break;
    case "setFilteredData":
      newState = {
        ...state,
        filteredData: action.filteredData,
      };
      break;
    case "deleteRow":
      const edit = { edit: "deleteRow" as const, row: action.row };
      const { parsedData, filteredData } = applyEdits(
        state.parsedData,
        state.filteredData,
        [edit]
      );
      newState = {
        ...state,
        parsedData,
        filteredData,
        edits: [...state.edits, edit],
      };
      break;
    case "deleteColumn":
      const e = { edit: "deleteColumn" as const, column: action.column };
      // TODO must be a nicer way to do this without a switch statement
      const { parsedData: pd, filteredData: fd } = applyEdits(
        state.parsedData,
        state.filteredData,
        [e]
      );
      newState = {
        ...state,
        parsedData: pd,
        filteredData: fd,
        edits: [...state.edits, e],
      };
      break;
  }
  return newState;
}

// context

export type EditStoreDispatch = React.Dispatch<EditStoreAction>;

const EditStoreContext = React.createContext<{
  state: EditStoreState;
  dispatch: EditStoreDispatch;
  actions: EditStoreActions;
}>({
  state: editStoreInitialState,
  dispatch: () => {
    throw new Error("EditStoreProvider not initialized");
  },
  actions,
});

export function EditStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, editStoreInitialState);
  return (
    <EditStoreContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </EditStoreContext.Provider>
  );
}

export function useEditStore() {
  return React.useContext(EditStoreContext);
}
