import { useContext, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";

import { DocStoreContext } from "../stores/DocStore";
import { Stack } from "@mui/system";

export default function Chat() {
  const [message, setMessage] = useState("");

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
    <Container
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        {state.chatHistory.map((chat, index) => (
          <Box
            key={index}
            sx={{
              backgroundColor: chat.role === "user" ? "#440000" : "$004400",
            }}
          >
            {chat.text}
          </Box>
        ))}
      </Box>
      <Stack direction="row">
        <TextField
          label="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <Button variant="contained" color="primary" onClick={handleSend}>
          Send
        </Button>
      </Stack>
    </Container>
  );
}
