import { useReducer, createContext, ReactNode } from "react";
import { ChatMessage, ChatRequest } from "../client";

export enum ChatStatus {
  READY = "ready",
  WAITING = "waiting",
  ERROR = "error",
}

interface ChatStore {
  history: ChatMessage[];
  status: ChatStatus;
  test: boolean;
  model: ChatRequest.model;
}

export const chatStoreInitialState = {
  history: [],
  status: ChatStatus.READY,
  test: false,
  model: ChatRequest.model.GPT_3_5_TURBO,
};

function reducer(state: ChatStore, action: Partial<ChatStore>) {
  const newState = {
    ...state,
    ...action,
  };
  return newState;
}

export const ChatStoreContext = createContext<{
  state: ChatStore;
  dispatch: React.Dispatch<Partial<ChatStore>>;
}>({ state: chatStoreInitialState, dispatch: () => null });

export const ChatStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, chatStoreInitialState);
  return (
    <ChatStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatStoreContext.Provider>
  );
};
