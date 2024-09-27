// Based on
// https://adevnadia.medium.com/how-to-debounce-and-throttle-in-react-without-losing-your-mind-4de6193a587

"use client";

import { useEffect, useMemo, useRef } from "react";
import { debounce } from "remeda";

export default function useDebounce<T extends (...args: any) => any>(
  callback: T,
  waitMs = 500
) {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = ((...args: any) => {
      return ref.current?.(...args);
    }) as T;

    return debounce<T>(func, { waitMs, timing: "both" });
  }, [waitMs]);

  return debouncedCallback;
}
