"use client";

import React from "react";

import { MoreHorizontal, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stack } from "@/components/ui/stack";
import { useIdentificationStore } from "@/stores/identification-store";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import SuggestWidgetsButton from "../widget/suggest-widgets-button";
import WidgetBar from "../widget/widget-bar";

export default function ControlPanel() {
  const identificationStore = useIdentificationStore();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleAutoIdentify = () => {
    setDialogOpen(true);
  };

  const handleContinue = () => {
    identificationStore.autoIdentify();
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <Stack direction="row" gap={2}>
      <SuggestWidgetsButton />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            More Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleAutoIdentify}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-identify columns
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WidgetBar />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-identify Columns</DialogTitle>
            <DialogDescription>
              This will overwrite any existing column identifications. Are you
              sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleContinue}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
