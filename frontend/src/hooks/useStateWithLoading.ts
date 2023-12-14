import { useState } from "react";

/**
 * Hook that extends useState to include a loading state. When initialized,
 * isLoading is true. When the state is set, isLoading is false. Initial state
 * is always null. State type includes null. Set state to null to indicate
 * failure.
 */
export default function useStateWithLoading<T>(): [
  T | null,
  (state: T | null) => void,
  boolean
] {
  const [state, setState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setStateExtended = (state: T | null) => {
    setState(state);
    setIsLoading(false);
  };
  return [state, setStateExtended, isLoading];
}
