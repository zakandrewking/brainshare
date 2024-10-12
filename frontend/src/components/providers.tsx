"use client";

import * as React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfigProvider from "@/config/ConfigProvider";

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
          {children}
        </ThemeProvider>
      </TooltipProvider>
    </ConfigProvider>
  );
}
