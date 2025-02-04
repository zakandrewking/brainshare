"use client";

import React from "react";

import { toast } from "sonner";

import {
  LoadingState,
  useIdentificationStoreHooks,
} from "@/stores/identification-store";

const LOADING_TOAST_ID = "loading-identifications-toast";
const IDENTIFYING_TOAST_ID = "identifying-columns-toast";

export default function LoadingDetailBar() {
  const idHooks = useIdentificationStoreHooks();
  const loadingState = idHooks.useLoadingState();
  const isIdentifying = idHooks.useIsIdentifying();

  React.useEffect(() => {
    if (loadingState === LoadingState.LOADING) {
      toast.loading("Loading table identifications...", {
        id: LOADING_TOAST_ID,
      });
    } else if (
      loadingState === LoadingState.LOADED ||
      loadingState === LoadingState.UNLOADED
    ) {
      toast.dismiss(LOADING_TOAST_ID);
    } else if (loadingState === LoadingState.ERROR) {
      toast.error("Failed to load table identifications", {
        id: LOADING_TOAST_ID,
      });
    }
  }, [loadingState]);

  // This is just a wrapper component that manages toasts
  // It doesn't render anything directly
  return null;
}
