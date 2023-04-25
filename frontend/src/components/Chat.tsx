import { useContext, useState, useRef, useEffect, ReactElement } from "react";
import Paper from "@mui/material/Paper";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import TextField from "@mui/material/TextField";

import { DocStoreContext } from "../stores/DocStore";

import useMediaQuery from "@mui/material/useMediaQuery";
import { Divider } from "@mui/material";

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => elementRef?.current?.scrollIntoView());
  return <div ref={elementRef} />;
};

export default function Chat({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const { state, dispatch } = useContext(DocStoreContext);

  const handleSend = () => {
    if (message !== "") {
      dispatch({
        chatHistory: [...state.chatHistory, { text: message, role: "user" }],
      });
      setMessage("");
    }
  };

  return (
    <Paper
      elevation={10}
      sx={{
        height: { xs: "100%", sm: "80%" },
        width: { xs: "100%", sm: "500px" },
        position: "fixed",
        bottom: { xs: 0, sm: "14px" },
        right: { xs: 0, sm: "14px" },
        backgroundColor: prefersDarkMode ? "#384f6f" : "#fff",
        backgroundImage: "none",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "14px",
        gap: "10px",
      }}
    >
      <Box
        sx={{ overflow: "scroll", flexGrow: 1, overscrollBehavior: "contain" }}
      >
        {state.chatHistory
          .map((chat, index) => (
            <Box m={3} key={index}>
              {chat.role}: {chat.text}
            </Box>
          ))
          .reduce(
            (prev: any, curr: any) =>
              prev.length === 0 ? [curr] : [prev, <Divider />, curr],
            []
          )}
        <AlwaysScrollToBottom />
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "8px",
        }}
      >
        <TextField
          sx={{
            flexGrow: 1,
          }}
          label="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <Button variant="outlined" color="primary" onClick={handleSend}>
          Send
        </Button>
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 10,
        }}
      >
        <Fab
          color="secondary"
          size="small"
          aria-label="close"
          onClick={onClose}
        >
          <CloseRoundedIcon />
        </Fab>
      </Box>
    </Paper>
  );
}
