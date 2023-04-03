import React, { useState } from "react";

import Button from "@mui/material/Button";
import {
  createStyles,
  createTheme,
  makeStyles,
  ThemeProvider,
} from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";

type ChatMessage = {
  text: string;
  sender: "user" | "bot";
};

export default function ChatUI(): React.ReactNode {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  //   const theme = React.useMemo(
  //     () =>
  //       createTheme({
  //         palette: {
  //           mode: prefersDarkMode ? "dark" : "light",
  //         },
  //       }),
  //     [prefersDarkMode]
  //   );

  //   const useStyles = makeStyles((theme) =>
  //     createStyles({
  //       chatUI: {
  //         display: "flex",
  //         flexDirection: "column",
  //         height: "100%",
  //         padding: theme.spacing(2),
  //         backgroundColor: theme.palette.background.default,
  //         color: theme.palette.text.primary,
  //       },
  //       chatHistory: {
  //         flex: 1,
  //         display: "flex",
  //         flexDirection: "column-reverse",
  //         overflowY: "auto",
  //         marginBottom: theme.spacing(2),
  //       },
  //       message: {
  //         maxWidth: "70%",
  //         padding: theme.spacing(1),
  //         borderRadius: theme.shape.borderRadius,
  //         marginBottom: theme.spacing(1),
  //       },
  //       userMessage: {
  //         alignSelf: "flex-end",
  //         backgroundColor: theme.palette.primary.main,
  //         color: theme.palette.primary.contrastText,
  //       },
  //       botMessage: {
  //         alignSelf: "flex-start",
  //         backgroundColor: theme.palette.grey[200],
  //       },
  //       chatInput: {
  //         display: "flex",
  //         alignItems: "center",
  //       },
  //       textField: {
  //         flex: 1,
  //         marginRight: theme.spacing(1),
  //         backgroundColor: theme.palette.background.paper,
  //       },
  //       sendButton: {
  //         marginLeft: theme.spacing(1),
  //       },
  //     })
  //   );

  //   const classes = useStyles();

  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSend = (): void => {
    if (message !== "") {
      setChatHistory([...chatHistory, { text: message, sender: "user" }]);
      setMessage("");
    }
  };

  return (
    // <ThemeProvider theme={theme}>
    <div
    //  className={classes.chatUI}
    >
      <div
      //   className={classes.chatHistory}
      >
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            // className={`${classes.message} ${
            //   chat.sender === "user" ? classes.userMessage : classes.botMessage
            // }`}
          >
            {chat.text}
          </div>
        ))}
      </div>
      <div
      //   className={classes.chatInput}
      >
        <TextField
          //   className={classes.textField}
          label="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <Button
          //   className={classes.sendButton}
          variant="contained"
          color="primary"
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </div>
    // </ThemeProvider>
  );
}
