import { createContext, useContext, useState, ReactNode } from "react";

import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";

// TODO include a support link to github issues.
const defaultMessage = "Something went wrong. Please try again soon.";

type ErrorBarContextType = {
  showError: (errorMessage?: string) => void;
};

const ErrorBarContext = createContext<ErrorBarContextType>({
  showError: () => {},
});

export function ErrorBarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const showError = (errorMessage = defaultMessage) => {
    setMessage(errorMessage);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);
  return (
    <ErrorBarContext.Provider value={{ showError }}>
      {children}
      <Snackbar
        autoHideDuration={3000}
        open={open}
        onClose={handleClose}
        message={message}
        action={
          <Button onClick={handleClose} sx={{ color: "#90caf9" }}>
            Close
          </Button>
        }
      />
    </ErrorBarContext.Provider>
  );
}

export default function useErrorBar() {
  const context = useContext(ErrorBarContext);
  if (context === undefined)
    throw Error("useErrorBar must be used within ErrorBarProvider");
  return context;
}
