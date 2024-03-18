// TODO put this in local storage

import { Dispatch, ReactNode, createContext, useReducer } from "react";

export interface CurrentProjectState {
  id: number | undefined;
}

export const currentProjectInitialState = {
  id: undefined,
};

const reducer = (
  state: CurrentProjectState,
  action: Partial<CurrentProjectState>
) => {
  if (action.id === undefined) {
    throw Error("id cannot be unset");
  }
  return {
    ...state,
    ...action,
  };
};

export const CurrentProjectStoreContext = createContext<{
  state: CurrentProjectState;
  dispatch: Dispatch<Partial<CurrentProjectState>>;
}>({
  state: currentProjectInitialState,
  dispatch: () => {
    throw Error("CurrentProjectStoreProvider not initialized");
  },
});

export const CurrentProjectStoreProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, currentProjectInitialState);
  return (
    <CurrentProjectStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </CurrentProjectStoreContext.Provider>
  );
};
