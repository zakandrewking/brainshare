"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { mutate } from "swr";

import { useAuth } from "@clerk/nextjs";

import { showError } from "@/components/error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DelayedLoadingSpinner } from "@/components/ui/loading";
import { Stack } from "@/components/ui/stack";
import { Database } from "@/database.types";
import useDebounce from "@/hooks/useDebounce";
import { useSupabase } from "@/lib/supabaseClient";

type AppType = Database["public"]["Tables"]["app"]["Row"];

export default function CreateAppDialog() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  // null = valid; undefined = not checked; string = invalid
  const [validateMessage, setValidateMessage] = useState<
    string | null | undefined
  >(undefined);

  // --------
  // Handlers
  // --------

  const handleCreateApp = async () => {
    debouncedValidate.cancel();
    setIsCreating(true);
    const newAppNameTrimmed = appName.trim();
    const { data: app, error } = await supabase!
      .from("app")
      .insert({
        name: newAppNameTrimmed,
        user_id: userId!,
      })
      .select("*")
      .single();
    if (error || !app) {
      setIsCreating(false);
      showError();
      throw error ?? Error("No app returned");
    }
    mutate("/apps", (data: AppType[] | undefined) => [...(data ?? []), app]);
    setIsCreating(false);
    setOpen(false);
    setAppName("");
    router.push(`/app/${app.id}`);
  };

  const validateExternal = useCallback(
    async (name: string) => {
      // TODO filter by project
      const { data, error } = await supabase!
        .from("app")
        .select("id")
        .ilike("name", name)
        .limit(1);

      setIsValidating(false);

      if (error) {
        setValidateMessage("Something went wrong. Please try again soon.");
        throw error;
      }
      const isValid = data?.length === 0;
      setValidateMessage(isValid ? null : "Name is already in use.");
    },
    [supabase]
  );
  const debouncedValidate = useDebounce(validateExternal);

  const handleValidate = async (newAppName: string) => {
    const newAppNameTrimmed = newAppName.trim();

    const minLength = 3;
    const maxLength = 100;

    if (newAppNameTrimmed.length < minLength) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage((m) =>
        m === undefined ? undefined : "Name must be at least 3 characters."
      );
      return;
    }

    // check length
    if (newAppNameTrimmed.length > maxLength) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage("Name is too long.");
      return;
    }

    // check for invalid characters
    if (newAppNameTrimmed.indexOf("\u0000") !== -1) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage("Name includes an invalid character \\u0000.");
      return;
    }

    setIsValidating(true);
    await debouncedValidate.call(newAppNameTrimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setValidateMessage(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => {
            setOpen(true);
            handleValidate(appName);
          }}
        >
          Create App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* use a form so we can "enter" to submit */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCreateApp();
          }}
        >
          <DialogHeader>
            <DialogTitle>Create a new app</DialogTitle>
          </DialogHeader>
          <Stack className="py-4" alignItems="start" gap={2}>
            <Input
              autoFocus
              value={appName}
              onChange={async (event) => {
                const newName = event.target.value;
                setAppName(newName);
                await handleValidate(newName);
              }}
              className="text-lg"
              placeholder="App name"
            />
            <div className="min-h-6">
              {isValidating
                ? "Checking..."
                : validateMessage === undefined
                ? " "
                : validateMessage === null
                ? "OK!"
                : validateMessage}
            </div>
          </Stack>
          <DialogFooter className="flex flex-row gap-2 items-center">
            {isCreating && <DelayedLoadingSpinner delayMs={100} />}
            <Button
              type="submit"
              disabled={isValidating || validateMessage !== null || isCreating}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
