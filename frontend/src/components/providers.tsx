"use client";

import React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfigProvider from "@/config/ConfigProvider";
import { TableStoreProvider } from "@/stores/table-store";
import { AuthProvider } from "@/utils/supabase/client";

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
          <AuthProvider>
            <TableStoreProvider>{children}</TableStoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </ConfigProvider>
  );
}
