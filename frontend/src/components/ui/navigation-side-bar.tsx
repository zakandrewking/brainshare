"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { Button } from "./button";

function NavigationMenuButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8";

  return (
    <Drawer direction="left">
      <DrawerTrigger
        className={smIconButtonClasses}
        //   size="icon-sm"
        // TODO bring back when we have a responsive drawer
        // className="md:hidden"
        //   variant="ghost"
      >
        <Menu />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerDescription />
          <DrawerClose className={smIconButtonClasses}>
            <X />
          </DrawerClose>
        </DrawerHeader>
        <DrawerFooter>Version: TODO</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { NavigationMenuButton };
