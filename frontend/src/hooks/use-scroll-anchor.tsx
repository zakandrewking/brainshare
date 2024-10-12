import { useCallback, useEffect, useRef, useState } from "react";

export const useScrollAnchor = () => {
  const messagesRef = useRef<HTMLDivElement>(null);
  const visibilityRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      if (isAtBottom && !isVisible) {
        messagesRef.current.scrollIntoView({
          block: "end",
        });
      }
    }
  }, [isAtBottom, isVisible]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const offset = 50;
      const isAtBottom =
        window.scrollY + window.innerHeight + offset >=
        document.body.scrollHeight;

      setIsAtBottom(isAtBottom);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (visibilityRef.current) {
      let observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          });
        },
        {
          rootMargin: "0px 0px -150px 0px",
        }
      );

      observer.observe(visibilityRef.current);

      return () => {
        observer.disconnect();
      };
    }
  });

  return {
    messagesRef,
    visibilityRef,
    scrollToBottom,
    isAtBottom,
    isVisible,
  };
};
