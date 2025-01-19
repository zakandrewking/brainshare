import React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConfigProvider from "@/config/ConfigProvider";
import { UserProvider } from "@/utils/supabase/client";
import { WithUser } from "@/utils/supabase/server";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WithUser
      children={(user) => (
        <UserProvider user={user}>
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
        </UserProvider>
      )}
    />
  );
}
