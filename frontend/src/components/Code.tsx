import { ReactNode } from "react";
import Typography from "@mui/material/Typography";

export default function Code({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "Fira Code, monospace",
        wordBreak: "break-all",
        userSelect: "all",
        fontSize: "15px",
      }}
    >
      {children}
    </Typography>
  );
}
