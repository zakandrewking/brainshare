import React from "react";

import { getSuggestWidgetWidgetsSuggestPost } from "@/client";
import { SuggestWidgetArgs } from "@/client/types.gen";

import { useBackend } from "./backend-provider";

export function useSuggestWidget() {
  const backend = useBackend();

  const suggestWidget = React.useCallback(
    async (args: SuggestWidgetArgs) => {
      const { data: response, error } =
        await getSuggestWidgetWidgetsSuggestPost({
          client: backend!,
          body: args,
        });
      if (error) throw error;
      if (!response) throw Error("No response");
      return response;
    },
    [backend]
  );

  return suggestWidget;
}
