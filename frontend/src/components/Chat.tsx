import {
  RefObject,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Divider } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from "@mui/material/NativeSelect";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";

import { ChatMessage, ChatRequest, DefaultService } from "../client";
import { ChatStatus, ChatStoreContext } from "../stores/ChatStore";
import { useAuth } from "../supabase";
import { capitalizeFirstLetter } from "../util/stringUtils";
import { pageTextDescription } from "../util/ai";

function ChatContainer({
  fullScreen,
  children,
  onClose,
}: {
  fullScreen: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  if (fullScreen) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 56px)",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          padding: "14px",
        }}
      >
        {children}
      </Box>
    );
  }

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
      {children}
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

function ModelSelection() {
  const { state, dispatch } = useContext(ChatStoreContext);
  return (
    <FormControl sx={{ maxWidth: "300px" }}>
      <InputLabel htmlFor="model-select" variant="outlined">
        Model
      </InputLabel>
      <NativeSelect
        variant="outlined"
        defaultValue={state.model}
        onChange={(e) => {
          dispatch({ model: e.target.value as ChatRequest.model });
        }}
        inputProps={{
          name: "Model",
          id: "model-select",
        }}
      >
        {Object.values(ChatRequest.model).map((model, i) => (
          <option key={i} value={model}>
            {capitalizeFirstLetter(model)}
          </option>
        ))}
      </NativeSelect>
    </FormControl>
  );
}

function AlwaysScrollToBottom() {
  const elementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => elementRef?.current?.scrollIntoView());
  return <div ref={elementRef} />;
}

function Messages() {
  const { state } = useContext(ChatStoreContext);
  return (
    <Box
      sx={{
        overflow: "scroll",
        flexGrow: 1,
        overscrollBehavior: "contain",
      }}
    >
      {[
        ...state.history,
        ...(state.status === ChatStatus.WAITING
          ? [
              {
                content: "▊",
                role: ChatMessage.role.ASSISTANT,
              },
            ]
          : state.status === ChatStatus.ERROR
          ? [
              {
                content: "An error occurred. Try again soon.",
                role: ChatMessage.role.ASSISTANT,
              },
            ]
          : []),
      ]
        .map((chat, index) => (
          <Box m={3} key={index}>
            {capitalizeFirstLetter(chat.role)}: {chat.content}
          </Box>
        ))
        .reduce(
          (prev: any, curr: any) =>
            prev.length === 0 ? [curr] : [prev, <Divider />, curr],
          []
        )}

      <AlwaysScrollToBottom />
    </Box>
  );
}

function ChatInput({ inputRef }: { inputRef: RefObject<HTMLInputElement> }) {
  const [message, setMessage] = useState("");
  const { state, dispatch } = useContext(ChatStoreContext);

  const handleSend = () => {
    if (message !== "") {
      dispatch({
        history: [
          ...state.history,
          { content: message, role: ChatMessage.role.USER },
        ],
      });
      setMessage("");
    }
  };

  return (
    <Box
      sx={{
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
        autoComplete="off"
        onChange={(e) => setMessage(e.target.value)}
        inputRef={inputRef}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
      />
      <Button variant="outlined" color="primary" onClick={handleSend}>
        Send
      </Button>
    </Box>
  );
}

function LogInToChat({ onClose }: { onClose: () => void }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Button
        variant="outlined"
        component={RouterLink}
        to="/log-in"
        onClick={onClose}
      >
        Log in to chat
      </Button>
    </Box>
  );
}

export default function Chat({
  onClose = () => {},
  fullScreen = false,
}: {
  onClose?: () => void;
  fullScreen?: boolean;
}) {
  const { session } = useAuth();
  const { state, dispatch } = useContext(ChatStoreContext);

  // on appear, focus the input
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Call the chat API
  useEffect(() => {
    // TODO LEFT OFF we are running this more than once ... navigation causes it
    // to fire again. we should put this effect in the store, or
    // at the top level of the app, or use a ref
    const go = async () => {
      // If the last message was from the user, send it to the API
      if (
        state.history.length > 0 &&
        state.history[state.history.length - 1].role === ChatMessage.role.USER
      ) {
        dispatch({ status: ChatStatus.WAITING });
        try {
          const res = await DefaultService.postChatWithContext({
            history: state.history,
            context: {
              current_page:
                pageTextDescription(window.location.pathname) ?? undefined,
            },
            model: state.model,
          });
          dispatch({
            history: [
              ...state.history,
              { content: res.content, role: ChatMessage.role.ASSISTANT },
            ],
            status: ChatStatus.READY,
          });
        } catch (error) {
          console.error(error);
          dispatch({ status: ChatStatus.ERROR });
        }
      }
    };
    go(); // are we still doing this?
  }, [state.history]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChatContainer fullScreen={fullScreen} onClose={onClose}>
      {session ? (
        <>
          {/* <ModelSelection /> */}
          <Messages />
          <ChatInput inputRef={inputRef} />
        </>
      ) : (
        <LogInToChat onClose={onClose} />
      )}
    </ChatContainer>
  );
}
