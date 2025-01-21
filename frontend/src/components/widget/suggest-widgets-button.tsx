"use client";

import React from "react";

import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import {
  suggestWidget,
  SuggestWidgetColumn,
} from "@/actions/suggest-widget";
import useIsSSR from "@/hooks/use-is-ssr";
import { useEditStore } from "@/stores/edit-store";
import { useIdentificationStore } from "@/stores/identification-store";
import {
  useWidgetStore,
  WidgetType,
} from "@/stores/widget-store";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

type FormState = {
  error: string | null;
  suggestions?: Array<{
    id: string;
    type: WidgetType;
    name: string;
    description: string;
    isSuggested: boolean;
    vegaLiteSpec: any;
  }>;
};

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

  const [state, formAction, isPending] = React.useActionState(
    suggestWidget.bind(null, columns),
    {}
  );

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.suggestion) {
      widgetStore.addWidget({
        ...state.suggestion,
        isSuggested: true,
        type: WidgetType.CHART,
      });
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending || !user || isSSR}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Suggest Widgets
      </Button>
    </form>
  );
}
