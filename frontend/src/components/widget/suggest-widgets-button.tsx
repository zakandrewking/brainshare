"use client";

import React from "react";

import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";

import { suggestWidget, SuggestWidgetColumn } from "@/actions/suggest-widget";
import useIsSSR from "@/hooks/use-is-ssr";
import { useEditStore } from "@/stores/edit-store";
import { useIdentificationStore } from "@/stores/identification-store";
import { useWidgetStore, WidgetType } from "@/stores/widget-store";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

export default function SuggestWidgetsButton() {
  const { user } = useUser();
  const isSSR = useIsSSR();
  const identificationStore = useIdentificationStore();
  const editStore = useEditStore();
  const widgetStore = useWidgetStore();

  const columns: SuggestWidgetColumn[] = React.useMemo(() => {
    if (!editStore.parsedData) return [];
    const firstRow = editStore.parsedData[0];
    if (firstRow?.length && firstRow.length > 30) {
      toast.warning("Only the first 30 columns will be used for suggestions");
    }
    const sampleData = editStore.parsedData
      .slice(0, 10)
      .map((row) => row.slice(0, 30));
    return Object.entries(identificationStore.identifications).map(
      ([columnIndex, identification]) => ({
        identification,
        sampleValues: sampleData
          .map((row) => row[parseInt(columnIndex)])
          .filter((value) => value !== undefined),
      })
    );
  }, [identificationStore.identifications, editStore.parsedData]);

  const { trigger, isMutating } = useSWRMutation(
    "/action/suggest-widget",
    async () => {
      try {
        const suggestion = await suggestWidget(columns);
        widgetStore.addWidget({
          ...suggestion,
          isSuggested: true,
          type: WidgetType.CHART,
        });
        widgetStore.setSidebarOpen(true);
      } catch (e) {
        console.error("Error suggesting widgets:", e);
        toast.error("Error suggesting widgets");
      }
    }
  );

  const ready = !isMutating && user && !isSSR;

  return (
    <Button onClick={() => trigger()} disabled={!ready}>
      {isMutating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <PlusCircle className="h-4 w-4 mr-2" />
      )}
      Suggest Widget
    </Button>
  );
}
