"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "../ui/button";
import { AddWidgetForm } from "./add-widget-form";

export function AddWidgetModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Widget</Button>
      </DialogTrigger>
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>Add a widget to your dashboard</DialogDescription>
        </VisuallyHidden>
        <AddWidgetForm />
      </DialogContent>
    </Dialog>
  );
}
