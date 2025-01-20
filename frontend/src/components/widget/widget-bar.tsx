"use client";

import React from "react";

import { LayoutGrid, PanelRightClose } from "lucide-react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import useIsSSR from "@/hooks/use-is-ssr";
import { useWidgetStore } from "@/stores/widget-store";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Stack } from "../ui/stack";
import { AddWidgetModal } from "./add-widget-modal";

export default function WidgetBar() {
  const [open, setOpen] = React.useState(false);
  const isSsr = useIsSSR();
  const { widgets, removeWidget } = useWidgetStore();

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
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <PanelRightClose className="h-4 w-4 mr-2" />
            Hide Widgets
          </Button>
        </DrawerHeader>

        {/* <Separator className="mx-4 w-[calc(100%-2rem)]" /> */}
        <Stack
          direction="col"
          gap={4}
          alignItems="start"
          className="w-full p-4"
        >
          {widgets.map((widget) => (
            <Card key={widget.id} className="w-full">
              <CardHeader>
                <CardTitle>{widget.name}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{widget.type}</p>
                <Button onClick={() => removeWidget(widget.id)}>Remove</Button>
              </CardContent>
            </Card>
          ))}
          <AddWidgetModal />
        </Stack>
      </DrawerContent>
    </Drawer>
  );
}
