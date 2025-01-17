"use client";

import React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfigProvider from "@/config/ConfigProvider";
import { IdentificationStoreProvider } from "@/stores/identification-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <TooltipProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IdentificationStoreProvider>{children}</IdentificationStoreProvider>
        </ThemeProvider>
      </TooltipProvider>
    </ConfigProvider>
  );
}
