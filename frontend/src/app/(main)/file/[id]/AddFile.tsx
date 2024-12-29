"use client";

import { useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";
import useSWR from "swr";

import { showError } from "@/components/error";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DelayedLoadingSpinner } from "@/components/ui/loading";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useIsSSR from "@/hooks/use-is-ssr";
import supabase from "@/utils/supabase/client";
import { cn } from "@/utils/tailwind";

export default function AddFileButton() {
  const isSSR = useIsSSR();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const { data: apps, error } = useSWR(
    "/apps",
    async () => {
      const { data, error } = await supabase.from("app").select("*");
      if (error) throw error;
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  function handleConnect() {
    setIsConnecting(true);
    // TODO hit the backend
    showError();
    setDialogOpen(false);
    setSelectedApp(null);
    setIsConnecting(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button disabled={isSSR}>Add file to an app</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Add file</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleConnect();
          }}
        >
          <DialogHeader>
            <DialogTitle>Connect this file to an app</DialogTitle>
          </DialogHeader>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-[200px] justify-between my-4"
              >
                {selectedApp && apps
                  ? apps.find((app) => app.id === selectedApp)?.name
                  : "Select app..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command label="Select app">
                <CommandInput placeholder="Search apps..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {apps?.map((app) => (
                    <CommandItem
                      value={app.id}
                      key={app.id}
                      keywords={[app.name]}
                      onSelect={(val) => {
                        setSelectedApp(val === selectedApp ? null : val);
                        setPopoverOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedApp === app.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {app.name}
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <DialogFooter className="flex flex-row gap-2 items-center">
            {isConnecting && <DelayedLoadingSpinner delayMs={100} />}
            <Button
              type="submit"
              disabled={selectedApp === null || isConnecting}
            >
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
