import { useReducer, createContext, ReactNode } from "react";
import { CrossrefWork } from "../client";

export interface DocStep {
  status?: string;
  error?: boolean;
  ready?: boolean;
}

export interface ChatMessage {
  text: string;
  role: "system" | "user" | "assistant";
}

interface DocState {
  uploadStatus: string | null;
  fileName: string | null;
  fileSize: number | null;
  crossref_work: CrossrefWork | null;
  text: string | null;
  parseStep: DocStep | null;
  annotateStep: DocStep | null;
  categories: string[];
  tags: string[];
  chatStep: DocStep | null;
  chatHistory: ChatMessage[];
}

export const docStoreInitialState = {
  uploadStatus: null,
  fileName: null,
  fileSize: null,
  crossref_work: null,
  text: null,
  parseStep: null,
  annotateStep: null,
  categories: [],
  tags: [],
  chatStep: null,
  chatHistory: [],
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
