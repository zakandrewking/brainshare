/**
 * Design Spec:
 * - Confirmation dialog that has a progress indicator for a longer running
 *   query.
 */

import { useState } from "react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import useErrorBar from "../hooks/useErrorBar";

export default function ConfirmDelete({
  table,
  onConfirm,
}: {
  table: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showError } = useErrorBar();

  return (
    <>
      <Button
        color="error"
        onClick={() => {
          setOpen(true);
        }}
        variant="outlined"
      >
        Delete {table}
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete this {table}?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this {table}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {isDeleting && <CircularProgress size={20} sx={{ mr: 2 }} />}
          <Button
            onClick={() => {
              setOpen(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsDeleting(true);
              try {
                await onConfirm();
              } catch (e) {
                setIsDeleting(false);
                showError();
                throw e;
              }
              setIsDeleting(false);
              setOpen(false);
            }}
            color="error"
            disabled={isDeleting}
          >
            {/* Destructive, so don't accept on enter */}
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
