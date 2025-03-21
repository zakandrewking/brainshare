"use client";

import React from "react";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import useIsSSR from "@/hooks/use-is-ssr";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { LoadingState } from "@/stores/store-loading";
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Stack } from "../ui/stack";
import VegaLite from "../vega/vega-lite";
import Sandbox from "./sandbox";
import SuggestWidgetsButton from "./suggest-widgets-button";

export default function WidgetBar() {
  const isSSR = useIsSSR();

  const widgetHooks = useWidgetStoreHooks();
  const loadingState = widgetHooks.useLoadingState();
  const widgets = widgetHooks.useWidgets();
  const removeWidget = widgetHooks.useRemoveWidget();
  const sidebarOpen = widgetHooks.useSidebarOpen();
  const setSidebarOpen = widgetHooks.useSetSidebarOpen();
  const setActiveEngine = widgetHooks.useSetActiveEngine();
  const sidebarWidth = widgetHooks.useSidebarWidth();
  const setSidebarWidth = widgetHooks.useSetSidebarWidth();
  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();

  const activeEngine = widgetHooks.useActiveEngine();

  // Calculate default sizes
  const defaultSizes = React.useMemo(() => {
    if (!sidebarOpen) return [100, 0];

    // If sidebar is open, calculate percentage based on stored width
    if (sidebarWidth) {
      const containerWidth = window.innerWidth;
      const sidebarPercentage = Math.min(
        90,
        Math.round((sidebarWidth / containerWidth) * 100)
      );
      return [100 - sidebarPercentage, sidebarPercentage];
    }

    // Default fallback
    return [70, 30];
  }, [sidebarOpen, sidebarWidth]);

  // Handle resize event
  const handleResize = React.useCallback(
    (sizes: number[]) => {
      // Only proceed if the panel is being resized
      if (sizes.length < 2 || !setSidebarWidth || !setSidebarOpen) return;

      // Calculate pixel width from percentage
      const containerWidth = window.innerWidth;
      const newWidth = Math.round((containerWidth * (sizes[1] ?? 0)) / 100);

      // Update the width in store
      setSidebarWidth(newWidth);
    },
    [setSidebarOpen, setSidebarWidth]
  );

  // Toggle sidebar - preserve width when opening
  const toggleSidebar = React.useCallback(() => {
    if (setSidebarOpen) {
      setSidebarOpen(!sidebarOpen);
    }
  }, [setSidebarOpen, sidebarOpen]);

  return (
    <>
      <Button
        variant="secondary"
        onClick={toggleSidebar}
        disabled={isSSR || loadingState !== LoadingState.LOADED}
        className="pointer-events-auto"
      >
        {sidebarOpen ? (
          <PanelRightClose className="h-4 w-4 mr-2" />
        ) : (
          <PanelRightOpen className="h-4 w-4 mr-2" />
        )}
        Charts
      </Button>

      <div className="fixed inset-0 top-[64px] z-10 pointer-events-none">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handleResize}
          className="h-full"
        >
          <ResizablePanel defaultSize={defaultSizes[0]} minSize={30}>
            <div className="h-full"></div>
          </ResizablePanel>

          {(defaultSizes[1] ?? 0) > 0 && (
            <>
              <ResizableHandle withHandle className="pointer-events-auto" />
              <ResizablePanel
                defaultSize={defaultSizes[1]}
                minSize={20}
                maxSize={90}
                className="border-l border-border/40 bg-background pointer-events-auto"
              >
                <div className="h-full overflow-y-auto">
                  <VisuallyHidden>
                    <h2>Charts</h2>
                    <p>Create a chart</p>
                  </VisuallyHidden>
                  <div className="p-2 w-full flex flex-row justify-start">
                    <Button variant="ghost" onClick={toggleSidebar}>
                      <PanelRightClose className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>

                  <Stack
                    direction="col"
                    gap={4}
                    alignItems="start"
                    className="w-full p-4"
                  >
                    <Stack direction="row" gap={2} className="w-full">
                      <span className="w-36">Widget Engine:</span>
                      <Select
                        value={activeEngine}
                        onValueChange={setActiveEngine}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a widget engine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vega-lite">Vega Lite</SelectItem>
                          <SelectItem value="observable-plot">
                            Observable Plot
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Stack>
                    <SuggestWidgetsButton />
                    {widgets?.map((widget) => (
                      <Card key={widget.name} className="w-full">
                        <CardHeader>
                          <CardTitle>{widget.name}</CardTitle>
                          <CardDescription>
                            {widget.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>{widget.type}</p>
                          {headers && identifications && (
                            <div className="mt-4">
                              {widget.engine === "vega-lite" &&
                                widget.vegaLiteSpec && (
                                  <VegaLite
                                    spec={widget.vegaLiteSpec}
                                    width={565}
                                    height={380}
                                    vegaPadding={{ x: 220, y: 120 }}
                                    data={parsedData}
                                    headers={headers}
                                    identifications={identifications}
                                  />
                                )}
                              {widget.engine === "observable-plot" && (
                                <Sandbox
                                  code={widget.observablePlotCode}
                                  data={parsedData}
                                  headers={headers}
                                  identifications={identifications}
                                  width="450px"
                                  height="380px"
                                />
                              )}
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
                  </Stack>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </>
  );
}
