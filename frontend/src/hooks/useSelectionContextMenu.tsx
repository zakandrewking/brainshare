import { CSSProperties, useEffect, useRef, useState } from "react";

import {
  autoUpdate,
  inline,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { Paper } from "@mui/material";

export function useSelectionContextMenu() {
  const ref = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { refs, context, floatingStyles } = useFloating({
    placement: "bottom",
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [inline()],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    function handleMouseUp(event: MouseEvent) {
      if (refs.floating.current?.contains(event.target as Element | null)) {
        return;
      }

      setTimeout(() => {
        const selection = window.getSelection();
        const range =
          typeof selection?.rangeCount === "number" && selection.rangeCount > 0
            ? selection.getRangeAt(0)
            : null;

        if (selection?.isCollapsed) {
          setIsOpen(false);
          return;
        }

        if (range) {
          refs.setPositionReference({
            getBoundingClientRect: () => range.getBoundingClientRect(),
            getClientRects: () => range.getClientRects(),
          });
          setIsOpen(true);
        }
      });
    }

    function handleMouseDown(event: MouseEvent) {
      if (refs.floating.current?.contains(event.target as Element | null)) {
        return;
      }

      if (window.getSelection()?.isCollapsed) {
        setIsOpen(false);
      }
    }

    const currentRef = ref.current;
    currentRef?.addEventListener("mouseup", handleMouseUp);
    currentRef?.addEventListener("mousedown", handleMouseDown);

    return () => {
      currentRef?.removeEventListener("mouseup", handleMouseUp);
      currentRef?.removeEventListener("mousedown", handleMouseDown);
    };
  }, [refs, ref]);

  return {
    isOpen,
    parentRef: ref,
    referenceRef: refs.setReference,
    floatingRef: refs.setFloating,
    floatingStyles,
    referenceProps: getReferenceProps(),
    floatingProps: getFloatingProps(),
  };
}

export function ContextMenu({
  floatingRef,
  floatingProps,
  floatingStyles,
}: {
  floatingRef: (node: HTMLElement | null) => void;
  floatingProps: Record<string, unknown>;
  floatingStyles: CSSProperties;
}) {
  return (
    <Paper
      ref={floatingRef}
      {...floatingProps}
      style={{
        ...floatingStyles,
        background: "black",
        color: "white",
        margin: 0,
        padding: 0,
        zIndex: 1000,
      }}
    >
      <>search</>
    </Paper>
  );
}
