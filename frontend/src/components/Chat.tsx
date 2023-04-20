import { useContext, useState, useRef, useEffect, ReactElement } from "react";
import Paper from "@mui/material/Paper";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import TextField from "@mui/material/TextField";

import { DocStoreContext } from "../stores/DocStore";

import useMediaQuery from "@mui/material/useMediaQuery";

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
      sx={{
        height: "80%",
        width: "500px",
        position: "fixed",
        bottom: "14px",
        right: "14px",
        backgroundColor: prefersDarkMode ? "#384f6f" : "#a3b3c7",
        backgroundImage: "none",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "14px",
        gap: "10px",
      }}
    >
      <Box sx={{ overflow: "scroll", flexGrow: 1 }}>
        {state.chatHistory.map((chat, index) => (
          <Box key={index}>{chat.text}</Box>
        ))}
        <AlwaysScrollToBottom />
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          backgroundColor: prefersDarkMode ? "#384f6f" : "#a3b3c7",
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
          sx={{
            boxShadow: "0px 0px 4px 2px rgb(255 255 255 / 10%)",
          }}
        >
          <CloseRoundedIcon />
        </Fab>
      </Box>
    </Paper>
  );
}
