"use client";

import React from "react";

import {
  Loader2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

import { suggestWidget } from "@/actions/suggest-widget";
import useIsSSR from "@/hooks/use-is-ssr";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import {
  useWidgetStoreHooks,
  WidgetType,
} from "@/stores/widget-store";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

export default function SuggestWidgetsButton() {
  const [isSuggestingWidgets, setIsSuggestingWidgets] = React.useState(false);
  const isSSR = useIsSSR();
  const { user } = useUser();

  // stores
  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  const widgetHooks = useWidgetStoreHooks();
  const addWidget = widgetHooks.useAddWidget();
  const widgets = widgetHooks.useWidgets();
  const setSidebarOpen = widgetHooks.useSetSidebarOpen();

  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();
  const isIdentifying = idHooks.useIsIdentifying();

  const columns = React.useMemo(() => {
    if (!parsedData) return [];
    const firstRow = parsedData[0];
    if (!firstRow) return [];

    const sampleData = parsedData.slice(0, 10).map((row) => row.slice(0, 30));

    return Object.entries(identifications).map(
      ([columnIndex, identification]) => ({
        fieldName: headers?.[parseInt(columnIndex)] ?? "",
        identification,
        sampleValues: sampleData
          .map((row) => row[parseInt(columnIndex)])
          .filter((value) => value !== undefined) as string[], // hint for next build
      })
    );
  }, [identifications, parsedData, headers]);

  const handleSuggestWidgets = async () => {
    setIsSuggestingWidgets(true);
    try {
      const response = await suggestWidget(columns, widgets, parsedData.length);
      addWidget({
        ...response,
        type: WidgetType.CHART,
        isSuggested: true,
      });
      setSidebarOpen(true);
    } catch (error) {
      console.error("Error suggesting widgets:", error);
      toast.error("Could not suggest widgets");
    } finally {
      setIsSuggestingWidgets(false);
    }
  };

  const ready = !isSuggestingWidgets && user && !isSSR && !isIdentifying;

  return (
    <Button
      onClick={handleSuggestWidgets}
      disabled={!ready}
      variant="secondary"
    >
      {isSuggestingWidgets ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <PlusCircle className="h-4 w-4 mr-2" />
      )}
      Suggest Widget
    </Button>
  );
}
