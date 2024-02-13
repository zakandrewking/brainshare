// Based on
// https://adevnadia.medium.com/how-to-debounce-and-throttle-in-react-without-losing-your-mind-4de6193a587

import { debounce } from "remeda";
import { useEffect, useMemo, useRef } from "react";

export default function useDebounce(callback: Function) {
  const ref = useRef<Function>();

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };

    return debounce(func, { waitMs: 1000 });
  }, []);

  return debouncedCallback;
}
