import { ReactNode } from "react";

import Box from "@mui/material/Box";

export function Bold({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ fontWeight: "medium" }}>
      {children}
    </Box>
  );
}
