import ModeToggle from "@/app/DarkModeToggle";
import { useSupabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

import { fontTitle } from "../fonts";
import { NavigationButtonWithDrawer } from "./navigation-drawer";
import { FillSpace, Stack } from "./stack";

function NavigationHeader() {
  const supabase = useSupabase();

  return (
    <div className="h-16">
      <Stack
        direction="row"
        gap={2}
        component="header"
        className="sticky p-3 top-0 z-50 w-full h-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <NavigationButtonWithDrawer />
        <h1
          className={cn(
            "text-3xl	mt-1 flex-shrink overflow-hidden",
            fontTitle.className
          )}
        >
          Brainshare
        </h1>
        <FillSpace />
        <ModeToggle />
      </Stack>
    </div>
  );
}
export { NavigationHeader };
