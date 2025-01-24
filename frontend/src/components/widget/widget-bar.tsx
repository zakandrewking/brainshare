"use client";

import React from "react";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { VegaLite } from "react-vega";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import useIsSSR from "@/hooks/use-is-ssr";
import { useEditStore } from "@/stores/edit-store";
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
  const isSSR = useIsSSR();
  const { widgets, removeWidget, sidebarOpen, setSidebarOpen } =
    useWidgetStore();
  const { parsedData, headers } = useEditStore();

  const plainObjectData = React.useMemo(() => {
    if (!parsedData?.length) return { table: [] };
    return {
      table: parsedData.map((row) => {
        const obj: Record<string, string> = {};
        headers?.forEach((header, j) => {
          if (header && row[j] !== undefined) {
            obj[header] = row[j];
          }
        });
        return obj;
      }),
    };
  }, [parsedData, headers]);

  return (
    <Drawer
      direction="right"
      modal={false}
      dismissible={false}
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <DrawerTrigger asChild>
        <Button variant="secondary" disabled={isSSR}>
          <PanelRightOpen className="h-4 w-4 mr-2" />
          Widgets
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-[32rem] max-w-full fixed bottom-0 top-[64px] right-0 ml-24 flex border-l-[1px] border-border/40 overflow-y-scroll">
        <VisuallyHidden>
          <DrawerTitle>Widgets</DrawerTitle>
          <DrawerDescription>Widget bar</DrawerDescription>
        </VisuallyHidden>
        <DrawerHeader className="p-2 w-full flex flex-row justify-start">
          <Button variant="ghost" onClick={() => setSidebarOpen(false)}>
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
            <Card key={widget.name} className="w-full">
              <CardHeader>
                <CardTitle>{widget.name}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{widget.type}</p>
                {widget.vegaLiteSpec && (
                  <div className="mt-4">
                    <VegaLite
                      spec={{
                        ...widget.vegaLiteSpec,
                        width: 240,
                        height: 200,
                      }}
                      data={plainObjectData}
                    />
                  </div>
                )}
                <Button
                  onClick={() => removeWidget(widget.name)}
                  className="mt-4"
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
          <AddWidgetModal />
        </Stack>
      </DrawerContent>
    </Drawer>
  );
}
