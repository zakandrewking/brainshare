import React from "react";

import { ColumnIdentification } from "@/actions/identify-column";

export interface TableStore {
  columnIdentifications: Record<number, ColumnIdentification>;
}

export const tableStoreInitialState: TableStore = {
  columnIdentifications: {},
};

function reducer(state: TableStore, action: Partial<TableStore>) {
  const newState = { ...state, ...action };
  return newState;
}

const TableStoreContext = React.createContext<{
  state: TableStore;
  dispatch: React.Dispatch<Partial<TableStore>>;
}>({
  state: tableStoreInitialState,
  dispatch: () => {
    throw new Error("TableStoreProvider not initialized");
  },
});

export function TableStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(reducer, tableStoreInitialState);

  return (
    <TableStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </TableStoreContext.Provider>
  );
}

export function useTableStore() {
  return React.useContext(TableStoreContext);
}
