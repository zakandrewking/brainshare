import { useState } from "react";

import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import { Box, Button, Paper } from "@mui/material";

import Graph from "./Graph";
import { drawerWidth } from "../util/constants";

export default function GraphCorner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "5px",
        left: { md: `${drawerWidth + 5}px`, xs: "5px" },
      }}
    >
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="contained"
          color="secondary"
          disableElevation
          sx={{ position: "absolute", bottom: "5px", left: "5px", zIndex: 100 }}
        >
          <AccountTreeRoundedIcon sx={{ mr: 1 }} />
          {isOpen ? "Close" : "Graph"}
        </Button>
      )}
      {isOpen && (
        <Paper elevation={2}>
          <Graph handleClose={() => setIsOpen(false)} />
        </Paper>
      )}
    </Box>
  );
}
