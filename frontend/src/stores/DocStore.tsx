import { useReducer, createContext, ReactNode } from "react";

export interface DocStep {
  status: string;
  error: boolean;
  ready: boolean;
}

interface DocState {
  uploadStatus: string | null;
  fileName: string | null;
  fileSize: number | null;
  text: string | null;
  parseStep: DocStep | null;
  chatStep: DocStep | null;
  annotationReady: boolean;
}

export const docStoreInitialState = {
  uploadStatus: null,
  fileName: null,
  fileSize: null,
  text: null,
  parseStep: null,
  chatStep: null,
  annotationReady: false,
};

const reducer = (state: DocState, action: Partial<DocState>) => ({
  ...state,
  ...action,
});

export const DocStoreContext = createContext<{
  state: DocState;
  dispatch: React.Dispatch<Partial<DocState>>;
}>({ state: docStoreInitialState, dispatch: () => null });

export const DocStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, docStoreInitialState);
  return (
    <DocStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </DocStoreContext.Provider>
  );
};
