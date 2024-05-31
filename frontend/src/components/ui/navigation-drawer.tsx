"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { Button } from "./button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { FillSpace, Stack } from "./stack";

function NavButton({
  href,
  match,
  setOpen,
  children,
}: {
  href: string;
  match: RegExp;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Button
      variant={pathname.match(match) ? "secondary" : "ghost"}
      className="w-full justify-start text-left"
      asChild
      onClick={() => setOpen(false)}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

/**
 * Menu button that also manages the nav drawer.
 */
function NavigationButtonWithDrawer() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="icon-sm" variant="ghost" disabled>
        <Menu />
      </Button>
    );
  }

  const smIconButtonClasses =
    "inline-flex items-center justify-center flex-shrink-0 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8";

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        className={smIconButtonClasses}
        //   size="icon-sm"
        // TODO bring back when we have a responsive drawer
        // className="md:hidden"
        //   variant="ghost"
      >
        <Menu />
      </DrawerTrigger>
      <DrawerContent className="p-2 items-start">
        <DrawerHeader className="p-2 w-full flex flex-row justify-end">
          <DrawerClose className={smIconButtonClasses}>
            <X />
          </DrawerClose>
        </DrawerHeader>
        <Stack direction="col" gap={1} className="w-full">
          <NavButton href="/" match={new RegExp("^/?$")} setOpen={setOpen}>
            Home
          </NavButton>
          <NavButton
            href="/apps"
            match={new RegExp("/apps?($|/)")}
            setOpen={setOpen}
          >
            Apps
          </NavButton>
          <NavButton
            href="/tools"
            match={new RegExp("/tools?($|/)")}
            setOpen={setOpen}
          >
            Tools
          </NavButton>
          <NavButton
            href="/docs"
            match={new RegExp("/docs?($|/)")}
            setOpen={setOpen}
          >
            Docs
          </NavButton>
        </Stack>
        <DrawerFooter> version: {process.env.NEXT_PUBLIC_GIT_SHA}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { NavigationButtonWithDrawer };
