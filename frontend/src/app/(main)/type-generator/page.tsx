"use client";

import React from "react";

import {
  suggestNewTypes,
  type TypeSuggestion,
} from "@/actions/type-generator/suggest-new-types";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import {
  List,
  ListItem,
  ListItemContent,
} from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import {
  H3,
  H4,
} from "@/components/ui/typography";
import { useAllTypes } from "@/hooks/use-types";

export default function TypeGeneratorPage() {
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [suggestedTypes, setSuggestedTypes] = React.useState<
    TypeSuggestion[] | null
  >(null);
  const mounted = React.useRef(true);

  const allTypes = useAllTypes({
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleGetSuggestions = async () => {
    if (allTypes === undefined) return;
    setIsSuggesting(true);
    const newSuggestions = await suggestNewTypes(allTypes);
    setSuggestedTypes([newSuggestions]);
    setIsSuggesting(false);
  };

  // Get suggestions on mount
  React.useEffect(() => {
    // only run once in strict mode
    if (allTypes && mounted.current) {
      handleGetSuggestions();
      mounted.current = false;
    }
  }, [allTypes]);

  const isLoading = isSuggesting || allTypes === undefined;

  return (
    <Container>
      {isLoading && <MiniLoadingSpinner />}
      <Stack gap={4} alignItems="start">
        <H3>Type Generator</H3>
        <p className="text-muted-foreground mb-8">
          Let's create lots of custom types for your data
        </p>
        <H4>Suggested Types</H4>
        <List>
          {suggestedTypes?.map((type) => (
            <ListItem key={type.type}>
              <ListItemContent>
                <em>{type.type}</em>
                <p>{type.description}</p>
                <p>{type.sampleValues.join(", ")}</p>
                <p>{type.kind}</p>
                <p>{type.needsMinMax ? "Needs min/max" : "No min/max"}</p>
                <p>{type.needsLogScale ? "Needs log scale" : "No log scale"}</p>
              </ListItemContent>
            </ListItem>
          ))}
        </List>
        <Button
          type="button"
          variant="outline"
          onClick={handleGetSuggestions}
          disabled={isLoading}
        >
          {"Get new suggestions"}
        </Button>
      </Stack>
    </Container>
  );
}
