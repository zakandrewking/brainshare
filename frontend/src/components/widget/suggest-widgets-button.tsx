"use client";

import React from "react";

import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { useSuggestWidget } from "@/components/backend/backend-client";
import useIsSSR from "@/hooks/use-is-ssr";
import { editStoreHooks as editHooks } from "@/stores/edit-store";
import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { LoadingState } from "@/stores/store-loading";
import { useWidgetStoreHooks } from "@/stores/widget-store";
import { nullToUndefined } from "@/utils/null-handling";
import { useUser } from "@/utils/supabase/client";

import { Button } from "../ui/button";

const progressMessages = [
  // Initial technical messages
  "Analyzing your data patterns...",
  "Discovering interesting trends...",
  "Teaching AI to appreciate your data...",

  // Playful technical messages
  "Consulting with digital data spirits...",
  "Performing statistical interpretive dance...",
  "Asking the quantum probability oracle...",
  "Converting coffee into visualizations...",

  // Getting more absurd
  "Solving differential equations for fun...",
  "Recruiting microscopic data scientists...",
  "Training hamsters to run visualization wheels...",
  "Negotiating with rebellious data points...",
  "Untangling coordinate systems...",
  "Bribing the random number generator...",
  "Reticulating visualization splines...",

  // New increasingly absurd messages
  "Teaching neural networks to juggle data...",
  "Convincing pixels to align themselves...",
  "Organizing a data point flash mob...",
  "Sending carrier pigeons to the cloud...",
  "Consulting the ancient scroll of matplotlib...",
  "Summoning the ghost of John Tukey...",
  "Feeding treats to boolean operators...",
  "Debugging quantum entangled variables...",
  "Massaging tensors until they relax...",
  "Applying machine learning to machine learning...",
  "Teaching regression models to moonwalk...",
  "Calculating the meaning of NaN...",
  "Hosting a tea party for outliers...",
  "Mediating disputes between correlated variables...",
  "Explaining p-values to confused algorithms...",
  "Conducting a seance with dead pixels...",
  "Teaching GANs to paint like Picasso...",
  "Optimizing the optimization optimizer...",
  "Counting infinity (twice for good measure)...",
  "Proving P equals NP (just kidding)...",

  // The final catch-all message
  "Still working... (the AI is being philosophical)",
];

export default function SuggestWidgetsButton() {
  const [isSuggestingWidgets, setIsSuggestingWidgets] = React.useState(false);
  const [progressMessageIndex, setProgressMessageIndex] = React.useState(0);
  const isSSR = useIsSSR();
  const user = useUser();
  const suggestWidget = useSuggestWidget();

  // stores
  const parsedData = editHooks.useParsedData();
  const headers = editHooks.useHeaders();

  const widgetHooks = useWidgetStoreHooks();
  const addWidget = widgetHooks.useAddWidget();
  const widgets = widgetHooks.useWidgets();
  const setSidebarOpen = widgetHooks.useSetSidebarOpen();
  const widgetsLoadingState = widgetHooks.useLoadingState();

  const idHooks = useIdentificationStoreHooks();
  const identifications = idHooks.useIdentifications();
  const isIdentifying = idHooks.useIsIdentifying();
  const activeEngine = widgetHooks.useActiveEngine();

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let usedIndices = new Set<number>();

    if (isSuggestingWidgets) {
      intervalId = setInterval(() => {
        setProgressMessageIndex((prev) => {
          // Always show the first message first
          if (prev === 0) return 1;

          // Show the final message after we've shown 12 random messages
          if (usedIndices.size >= 12) {
            return progressMessages.length - 1;
          }

          // Get a random message we haven't used yet
          let nextIndex;
          do {
            nextIndex =
              Math.floor(Math.random() * (progressMessages.length - 2)) + 1;
          } while (usedIndices.has(nextIndex));

          usedIndices.add(nextIndex);
          return nextIndex;
        });
      }, 2500); // Slightly faster rotation
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setProgressMessageIndex(0);
    };
  }, [isSuggestingWidgets]);

  const columns = React.useMemo(() => {
    if (!parsedData) return [];
    const firstRow = parsedData[0];
    if (!firstRow) return [];

    const sampleData = parsedData.slice(0, 10).map((row) => row.slice(0, 30));

    return Object.entries(identifications ?? {}).map(
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
    if (widgetsLoadingState !== LoadingState.LOADED) {
      return;
    }
    setIsSuggestingWidgets(true);
    try {
      // TODO make a repository / hook that imports the backend and binds it to
      // client. don't want to forget to do that
      const suggestion = await suggestWidget({
        columns,
        existingWidgets:
          widgets?.map((w) => ({
            name: w.name,
            description: w.description,
            vegaLiteSpec: w.vegaLiteSpec,
            observablePlotCode: w.observablePlotCode,
            engine: w.engine,
          })) ?? [],
        dataSize: parsedData.length,
        engine: activeEngine ?? "vega-lite",
      });
      addWidget({
        ...nullToUndefined(suggestion),
        type: "chart",
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

  const ready =
    !isSuggestingWidgets &&
    user &&
    !isSSR &&
    !isIdentifying &&
    widgetsLoadingState === LoadingState.LOADED;

  return (
    <Button
      onClick={handleSuggestWidgets}
      disabled={!ready}
      variant="secondary"
      className="min-w-[200px] transition-all duration-200"
    >
      {isSuggestingWidgets ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span className="animate-fade-in">
            {progressMessages[progressMessageIndex]}
          </span>
        </>
      ) : (
        <>
          <PlusCircle className="h-4 w-4 mr-2" />
          Suggest Chart
        </>
      )}
    </Button>
  );
}
