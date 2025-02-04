"use client";

import React from "react";

import { toast } from "sonner";

import { useIdentificationStoreHooks } from "@/stores/identification-store";
import { LoadingState } from "@/stores/store-loading";
import { useWidgetStoreHooks } from "@/stores/widget-store";

const LOADING_TOAST_ID = "loading-identifications-toast";
const SHOW_DELAY = 1000; // Show after 1s
const MIN_DURATION = 1000; // Show for at least 1s once visible

export default function LoadingDetailBar() {
  const idHooks = useIdentificationStoreHooks();
  const widgetHooks = useWidgetStoreHooks();
  const widgetLoadingState = widgetHooks.useLoadingState();
  const idLoadingState = idHooks.useLoadingState();

  const loadingStartTime = React.useRef<number | null>(null);
  const toastTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const toastShown = React.useRef(false);

  const isLoading =
    idLoadingState === LoadingState.LOADING ||
    widgetLoadingState === LoadingState.LOADING;

  React.useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = Date.now();
      toastShown.current = false;

      // Set timeout to show toast after delay
      toastTimeout.current = setTimeout(() => {
        toastShown.current = true;
        toast.loading("Loading details...", {
          id: LOADING_TOAST_ID,
        });
      }, SHOW_DELAY);
    } else {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);

      if (toastShown.current) {
        const elapsedTime = Date.now() - loadingStartTime.current!;
        const remainingTime = Math.max(
          0,
          MIN_DURATION - (elapsedTime - SHOW_DELAY)
        );

        if (remainingTime > 0) {
          setTimeout(() => toast.dismiss(LOADING_TOAST_ID), remainingTime);
        } else {
          toast.dismiss(LOADING_TOAST_ID);
        }
      }

      loadingStartTime.current = null;
      toastShown.current = false;
    }

    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, [isLoading]);

  // This is just a wrapper component that manages toasts
  // It doesn't render anything directly
  return null;
}
