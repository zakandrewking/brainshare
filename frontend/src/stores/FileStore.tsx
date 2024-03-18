import { ReactNode, createContext, useReducer } from "react";

export interface FileState {
  uploadStatus?: string;
  fileName?: string;
  fileSize?: number;
}

export const fileStoreInitialState = {};

const reducer = (state: FileState, action: Partial<FileState>) => ({
  ...state,
  ...action,
});

export const FileStoreContext = createContext<{
  state: FileState;
  dispatch: React.Dispatch<Partial<FileState>>;
}>({
  state: fileStoreInitialState,
  dispatch: () => {
    throw Error("FileStoreProvider not initialized");
  },
});

export const FileStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, fileStoreInitialState);
  return (
    <FileStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </FileStoreContext.Provider>
  );
};
