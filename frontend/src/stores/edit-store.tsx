import { createSelectorHooks } from "auto-zustand-selectors-hook";
import { create } from "zustand";

export type Edit =
  | { edit: "deleteRow"; row: number }
  | { edit: "deleteColumn"; column: number }
  | { edit: "edit"; column?: number; row?: number; value?: string };

interface EditState {
  prefixedId: string | null;
  headers: string[] | null;
  parsedData: string[][];
  filteredData: string[][];
  edits: Edit[];
}

interface EditActions {
  reset: () => void;
  setData: (data: {
    prefixedId: string;
    headers: string[];
    parsedData: string[][];
  }) => void;
  setFilteredData: (filteredData: string[][]) => void;
  // deleteRow: (row: number) => void;
  // deleteColumn: (column: number) => void;
}

const initialState: EditState = {
  prefixedId: null,
  headers: null,
  parsedData: [],
  filteredData: [],
  edits: [],
};

export type EditStore = EditState & EditActions;

// IMPORTANT: If starting state is non-deterministic or user-specific, we need
// to create & new store with every request (use React Context):
// - https://github.com/pmndrs/zustand/discussions/2326#discussioncomment-10102892
// - https://zustand.docs.pmnd.rs/guides/nextjs
const useEditStoreBase = create<EditStore>((set) => ({
  ...initialState,

  reset: () => set(initialState),

  setData: (data) => set(data),

  setFilteredData: (filteredData) => set({ filteredData }),

  // deleteRow: (row) =>
  //   set((state) => {
  //     const edit = { edit: "deleteRow" as const, row };
  //     const { parsedData, filteredData } = applyEdits(
  //       state.parsedData,
  //       state.filteredData,
  //       [edit]
  //     );
  //     return {
  //       parsedData,
  //       filteredData,
  //       edits: [...state.edits, edit],
  //     };
  //   }),

  // deleteColumn: (column) =>
  //   set((state) => {
  //     const edit = { edit: "deleteColumn" as const, column };
  //     const { parsedData, filteredData } = applyEdits(
  //       state.parsedData,
  //       state.filteredData,
  //       [edit]
  //     );
  //     return {
  //       parsedData,
  //       filteredData,
  //       edits: [...state.edits, edit],
  //     };
  //   }),
}));

export const editStoreHooks = createSelectorHooks(useEditStoreBase);
