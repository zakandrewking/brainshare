import React from "react";

import { suggestWidgetSuggestWidgetPost } from "@/client/sdk.gen";
import { SuggestWidgetArgs } from "@/client/types.gen";

import { useBackend } from "./backend-provider";

export function useSuggestWidget() {
  const backend = useBackend();

  const suggestWidget = React.useCallback(
    async (args: SuggestWidgetArgs) => {
      const { data: response, error } = await suggestWidgetSuggestWidgetPost({
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
