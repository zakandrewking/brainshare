import { RefObject, useEffect, useState } from "react";

export default function useScrollTop(ref: RefObject<HTMLDivElement>) {
  const [scrollTop, setScrollTop] = useState<number | null>(null);

  useEffect(() => {
    const getScrollTop = () => {
      return ref.current?.scrollTop ?? null;
    };

    setScrollTop(getScrollTop());

    const handleScroll = () => {
      setScrollTop(getScrollTop());
    };

    const thisRef = ref.current;
    thisRef?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      thisRef?.removeEventListener("scroll", handleScroll);
    };
  }, [ref]);

  return scrollTop;
}
