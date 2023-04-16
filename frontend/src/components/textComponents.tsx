import { ReactNode } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function Bold({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ fontWeight: "medium" }}>
      {children}
    </Box>
  );
}

export function Italic({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ fontStyle: "italic" }}>
      {children}
    </Box>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <Typography paragraph={true}>{children}</Typography>;
}
