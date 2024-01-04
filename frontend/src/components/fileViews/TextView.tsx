import { Box, Typography } from "@mui/material";

import {
  useSelectionContextMenu,
  ContextMenu,
} from "../../hooks/useSelectionContextMenu";
import { Bold } from "../textComponents";
import { memo } from "react";

export default function TextView({ text }: { text: string }) {
  const {
    isOpen,
    parentRef,
    referenceRef,
    floatingRef,
    floatingStyles,
    referenceProps,
    floatingProps,
  } = useSelectionContextMenu();

  return (
    <>
      <Box sx={{ mb: "20px" }}>
        <Bold>
          Hint: Highlight text to search for something in the public graph or
          project graphs
        </Bold>
      </Box>
      <Typography>Lines: {text.split("\n").length}</Typography>
      <Box
        ref={parentRef}
        sx={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "10px",
        }}
      >
        <Box ref={referenceRef} {...referenceProps}>
          <TextContent text={text} />
        </Box>
      </Box>
      {isOpen && (
        <ContextMenu
          floatingRef={floatingRef}
          floatingProps={floatingProps}
          floatingStyles={floatingStyles}
        />
      )}
    </>
  );
}

const TextContent = memo(function TextContent({ text }: { text: string }) {
  return <>{text}</>;
});
