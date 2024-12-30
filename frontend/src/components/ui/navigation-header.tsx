import Link from "next/link";

import { logOut } from "@/actions/log-out";
import DarkModeToggle from "@/app/DarkModeToggle";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/utils/tailwind";

import { fontTitle } from "../fonts";
import { Button } from "./button";
import { NavigationButtonWithDrawer } from "./navigation-drawer";
import { FillSpace, Stack } from "./stack";

async function NavigationHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <DarkModeToggle />
        {user ? (
          <form>
            <Button variant="outline" formAction={logOut}>
              Log Out
            </Button>
          </form>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/log-in">Log In</Link>
          </Button>
        )}
      </Stack>
    </div>
  );
}
export { NavigationHeader };
