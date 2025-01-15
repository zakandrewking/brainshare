import React from "react";

import { applyEdits } from "@/utils/tables";

// state

export type Edit =
  | { edit: "delete"; column: number; row: number }
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
  makeEdit: (edit: Edit) => ({
    type: "makeEdit" as const,
    edit,
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
    case "makeEdit":
      const { parsedData, filteredData } = applyEdits(
        state.parsedData,
        state.filteredData,
        [action.edit]
      );
      newState = {
        ...state,
        parsedData,
        filteredData,
        edits: [...state.edits, action.edit],
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
