"use client";

import { ReactNode, useEffect, useState } from "react";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "./button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { Stack } from "./stack";

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
  const [willOpen, setWillOpen] = useState(false);
  const [open, setOpen] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // The drawer doesn't like it when the active element is focused
  useEffect(() => {
    if (willOpen) {
      (document.activeElement as HTMLElement)?.blur();
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [willOpen]);

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
    <Drawer direction="left" open={open} onOpenChange={setWillOpen}>
      <DrawerTrigger
        className={smIconButtonClasses}
        //   size="icon-sm"
        // TODO bring back when we have a responsive drawer
        // className="md:hidden"
        //   variant="ghost"
      >
        <Menu />
      </DrawerTrigger>
      <DrawerContent
        className="p-2 items-start z-[1000] fixed inset-y-0 left-0 top-0 bottom-0 mr-24"
        aria-describedby="navigation-links"
      >
        <Stack
          direction="col"
          className="overflow-y-auto min-h-full"
          justifyContent="between"
        >
          <div className="w-full">
            <VisuallyHidden>
              <DrawerTitle>Navigation</DrawerTitle>
              <DrawerDescription>Navigation links</DrawerDescription>
            </VisuallyHidden>
            <DrawerHeader className="p-2 w-full flex flex-row justify-end">
              <DrawerClose className={smIconButtonClasses}>
                <X />
              </DrawerClose>
            </DrawerHeader>
            <Stack direction="col" gap={1} className="w-full">
              <NavButton
                href="/"
                match={new RegExp("^/?$")}
                setOpen={setWillOpen}
              >
                Home
              </NavButton>
              <NavButton
                href="/files"
                match={new RegExp("/files?($|/)")}
                setOpen={setWillOpen}
              >
                Files
              </NavButton>
              <NavButton
                href="/public-types"
                match={new RegExp("/public-types$")}
                setOpen={setWillOpen}
              >
                Public Types
              </NavButton>
              <NavButton
                href="/my-types"
                match={new RegExp("/my-types$")}
                setOpen={setWillOpen}
              >
                My Types
              </NavButton>
              <NavButton
                href="/type-generator"
                match={new RegExp("/type-generator$")}
                setOpen={setWillOpen}
              >
                Type Generator
              </NavButton>
              <NavButton
                href="/collab"
                match={new RegExp("/collab$")}
                setOpen={setWillOpen}
              >
                Collab
              </NavButton>
            </Stack>
          </div>
          <DrawerFooter>
            version: {process.env.NEXT_PUBLIC_GIT_SHA}
          </DrawerFooter>
        </Stack>
      </DrawerContent>
    </Drawer>
  );
}

export { NavigationButtonWithDrawer };
