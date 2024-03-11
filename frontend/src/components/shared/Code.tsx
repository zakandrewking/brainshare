import { ReactNode } from "react";
import Typography from "@mui/material/Typography";

// TODO https://github.com/react-syntax-highlighter/react-syntax-highlighter
// and
// https://github.com/nkbt/react-copy-to-clipboard

export default function Code({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: "Fira Code, monospace",
        wordBreak: "break-all",
        // userSelect: "all",
        fontSize: "15px",
      }}
    >
      {children}
    </Typography>
  );
}
