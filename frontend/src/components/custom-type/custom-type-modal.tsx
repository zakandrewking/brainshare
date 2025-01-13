"use client";

import React from "react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CustomTypeContext,
  CustomTypeForm,
} from "./custom-type-form";

interface CustomTypeModalProps {
  context: CustomTypeContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleCompareWithRedis: (
    column: number,
    typeKey: string,
    signal: AbortSignal
  ) => Promise<void>;
}

export default function CustomTypeModal({
  context,
  open,
  onOpenChange,
  handleCompareWithRedis,
}: CustomTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Custom Type</DialogTitle>
          <DialogDescription>
            Create a custom type for this column
          </DialogDescription>
        </VisuallyHidden>
        <CustomTypeForm
          context={context}
          onClose={() => onOpenChange(false)}
          handleCompareWithRedis={handleCompareWithRedis}
        />
      </DialogContent>
    </Dialog>
  );
}
