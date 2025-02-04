"use client";

import React from "react";

import { toast } from "sonner";

import {
  LoadingState,
  useIdentificationStoreHooks,
} from "@/stores/identification-store";

const LOADING_TOAST_ID = "loading-identifications-toast";
const SHOW_DELAY = 1000; // Show after 1s
const MIN_DURATION = 1000; // Show for at least 1s once visible

export default function LoadingDetailBar() {
  const idHooks = useIdentificationStoreHooks();
  const loadingState = idHooks.useLoadingState();
  const loadingStartTime = React.useRef<number | null>(null);
  const toastTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const toastShown = React.useRef(false);

  React.useEffect(() => {
    if (loadingState === LoadingState.LOADING) {
      loadingStartTime.current = Date.now();
      toastShown.current = false;

      // Set timeout to show toast after delay
      toastTimeout.current = setTimeout(() => {
        toastShown.current = true;
        toast.loading("Loading table identifications...", {
          id: LOADING_TOAST_ID,
        });
      }, SHOW_DELAY);
    } else if (
      loadingState === LoadingState.LOADED ||
      loadingState === LoadingState.UNLOADED
    ) {
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
    } else if (loadingState === LoadingState.ERROR) {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      if (toastShown.current) {
        toast.error("Failed to load table identifications", {
          id: LOADING_TOAST_ID,
        });
      }
      loadingStartTime.current = null;
      toastShown.current = false;
    }

    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, [loadingState]);

  // This is just a wrapper component that manages toasts
  // It doesn't render anything directly
  return null;
}
