"use client";

import * as React from "react";

import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfigProvider from "@/config/ConfigProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      {/* TODO set up offline development w Clerk */}
      <ClerkProvider>
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
      </ClerkProvider>
    </ConfigProvider>
  );
}
