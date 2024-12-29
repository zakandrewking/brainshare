"use client";

import React from "react";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { CustomTypeContext, CustomTypeForm } from "./custom-type-form";

interface CustomTypeModalProps {
  context: CustomTypeContext;
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomTypeModal({
  context,
  trigger,
  open,
  onOpenChange,
}: CustomTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <CustomTypeForm context={context} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
