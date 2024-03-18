/**
 * Design spec: Global store
 */

import { useReducer, createContext, ReactNode, Dispatch } from "react";
import { CrossrefWork, ResourceMatch } from "../client";

export interface DocStep {
  status?: string;
  error?: boolean;
  ready?: boolean;
}

interface DocState {
  uploadStatus: string | null;
  annotateStep: DocStep | null;
  parseStep: DocStep | null;
  saveStep: DocStep | null;
  //
  article_id: number | null;
  categories: ResourceMatch[];
  crossref_work: CrossrefWork | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  taskId: string | null;
  text: string | null;
  tokens: number | null;
}

export const docStoreInitialState = {
  uploadStatus: null,
  annotateStep: null,
  parseStep: null,
  saveStep: null,
  //
  article_id: null,
  categories: [],
  crossref_work: null,
  fileName: null,
  fileSize: null,
  tags: [],
  taskId: null,
  text: null,
  tokens: null,
};

const reducer = (state: DocState, action: Partial<DocState>) => ({
  ...state,
  ...action,
});

export const DocStoreContext = createContext<{
  state: DocState;
  dispatch: Dispatch<Partial<DocState>>;
}>({
  state: docStoreInitialState,
  dispatch: () => {
    throw Error("DocStoreProvider not initialized");
  },
});

export const DocStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, docStoreInitialState);
  return (
    <DocStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </DocStoreContext.Provider>
  );
};
