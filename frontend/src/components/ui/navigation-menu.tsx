import ModeToggle from "@/app/DarkModeToggle";

import { NavigationMenuButton } from "./navigation-side-bar";
import { FillSpace, Stack } from "./stack";

function NavigationMenu() {
  return (
    <header className="sticky p-3 top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <NavigationMenuButton />
      <Stack direction="row" spacing={2}>
        <h1>Brainshare -- Osprey edition</h1>
        <FillSpace />
        <ModeToggle />
      </Stack>
    </header>
  );
}
export { NavigationMenu };
