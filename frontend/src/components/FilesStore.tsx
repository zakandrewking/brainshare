import { ReactNode, createContext, useReducer } from "react";

export interface FilesState {
  uploadStatus?: string;
  fileName?: string;
  fileSize?: number;
}

export const filesStoreInitialState = {};

const reducer = (state: FilesState, action: Partial<FilesState>) => ({
  ...state,
  ...action,
});

export const FilesStoreContext = createContext<{
  state: FilesState;
  dispatch: React.Dispatch<Partial<FilesState>>;
}>({ state: filesStoreInitialState, dispatch: () => null });

export const FilesStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, filesStoreInitialState);
  return (
    <FilesStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </FilesStoreContext.Provider>
  );
};
