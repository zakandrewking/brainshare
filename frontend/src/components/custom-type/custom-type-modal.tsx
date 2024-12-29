"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CustomTypeContext, CustomTypeForm } from "./custom-type-form";

interface CustomTypeModalProps {
  context: CustomTypeContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomTypeModal({
  context,
  open,
  onOpenChange,
}: CustomTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Custom Type</DialogTitle>
        <CustomTypeForm context={context} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
