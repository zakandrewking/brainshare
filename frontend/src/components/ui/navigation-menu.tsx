import ModeToggle from "@/app/DarkModeToggle";

import { NavigationMenuButton } from "./navigation-side-bar";
import { FillSpace, Stack } from "./stack";
import LogOut from "@/app/LogOut";

function NavigationMenu() {
  return (
    <Stack
      direction="row"
      spacing={2}
      component="header"
      className="sticky p-3 top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <NavigationMenuButton />
      <h1>Brainshare -- Osprey edition</h1>
      <FillSpace />
      <ModeToggle />
      <LogOut />
    </Stack>
  );
}
export { NavigationMenu };
