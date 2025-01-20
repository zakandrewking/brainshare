"use client";

import React from "react";

import { LayoutGrid, X } from "lucide-react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import useIsSSR from "@/hooks/use-is-ssr";

import { Button } from "./ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

export default function WidgetBar() {
  const [open, setOpen] = React.useState(false);
  const isSsr = useIsSSR();

  return (
    <Drawer
      direction="right"
      modal={false}
      dismissible={false}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant="secondary" disabled={isSsr}>
          <LayoutGrid className="h-4 w-4 mr-2" />
          Widgets
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-[32rem] max-w-full fixed bottom-0 top-[64px] right-0 ml-24 flex border-l-[1px] border-border/40">
        <VisuallyHidden>
          <DrawerTitle>Widgets</DrawerTitle>
          <DrawerDescription>Widget bar</DrawerDescription>
        </VisuallyHidden>
        <DrawerHeader className="p-2 w-full flex flex-row justify-start">
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </DrawerHeader>
        <div className="p-4">
          <p>Widget content coming soon...</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
