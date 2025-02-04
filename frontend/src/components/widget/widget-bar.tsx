"use client";

import React from "react";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import useIsSSR from "@/hooks/use-is-ssr";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { useWidgetStoreHooks } from "@/stores/widget-store";

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
import VegaLite from "../vega/vega-lite";
import { AddWidgetModal } from "./add-widget-modal";
import SuggestWidgetsButton from "./suggest-widgets-button";

export default function WidgetBar() {
  const isSSR = useIsSSR();

  const widgetHooks = useWidgetStoreHooks();
  const widgets = widgetHooks.useWidgets();
  const removeWidget = widgetHooks.useRemoveWidget();
  const sidebarOpen = widgetHooks.useSidebarOpen();
  const setSidebarOpen = widgetHooks.useSetSidebarOpen();

  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();

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
      <DrawerContent className="w-[600px] max-w-full fixed bottom-0 top-[64px] right-0 ml-24 flex border-l-[1px] border-border/40 overflow-y-scroll">
        <VisuallyHidden>
          <DrawerTitle>Widgets</DrawerTitle>
          <DrawerDescription>Widget bar</DrawerDescription>
        </VisuallyHidden>
        <DrawerHeader className="p-2 w-full flex flex-row justify-start">
          <Button variant="ghost" onClick={() => setSidebarOpen(false)}>
            <PanelRightClose className="h-4 w-4 mr-2" />
            Hide Widgets
          </Button>
          <SuggestWidgetsButton />
        </DrawerHeader>

        <Stack
          direction="col"
          gap={4}
          alignItems="start"
          className="w-full p-4"
        >
          {widgets?.map((widget) => (
            <Card key={widget.name} className="w-full">
              <CardHeader>
                <CardTitle>{widget.name}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{widget.type}</p>
                {widget.vegaLiteSpec && headers && identifications && (
                  <div className="mt-4">
                    <VegaLite
                      spec={widget.vegaLiteSpec}
                      width={565}
                      height={380}
                      vegaPadding={{ x: 180, y: 120 }}
                      data={parsedData}
                      headers={headers}
                      identifications={identifications}
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
