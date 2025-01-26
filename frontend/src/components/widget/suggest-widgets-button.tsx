"use client";

import React from "react";

import {
  Loader2,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  suggestWidget,
  SuggestWidgetColumn,
} from "@/actions/suggest-widget";
import useIsSSR from "@/hooks/use-is-ssr";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import {
  widgetStoreHooks as widgetHooks,
  WidgetType,
} from "@/stores/widget-store";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

export default function SuggestWidgetsButton() {
  const [isSuggestingWidgets, setIsSuggestingWidgets] = React.useState(false);
  const isSSR = useIsSSR();
  const { user } = useUser();

  // edit store
  const parsedData = editHooks.useParsedData();

  // identification store
  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();

  // widget store
  const addWidget = widgetHooks.useAddWidget();
  const setSidebarOpen = widgetHooks.useSetSidebarOpen();

  const columns: SuggestWidgetColumn[] = React.useMemo(() => {
    if (!parsedData) return [];
    const firstRow = parsedData[0];
    if (!firstRow) return [];

    const sampleData = parsedData.slice(0, 10).map((row) => row.slice(0, 30));

    return Object.entries(identifications).map(
      ([columnIndex, identification]) => ({
        identification,
        sampleValues: sampleData
          .map((row) => row[parseInt(columnIndex)])
          .filter((value) => value !== undefined),
      })
    );
  }, [identifications, parsedData]);

  const handleSuggestWidgets = async () => {
    setIsSuggestingWidgets(true);
    try {
      const response = await suggestWidget(columns);
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

  const ready = !isSuggestingWidgets && user && !isSSR;

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
