"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { mutate } from "swr";

import { useAuth } from "@clerk/nextjs";

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
import { LoadingSpinner } from "@/components/ui/loading";
import { Stack } from "@/components/ui/stack";
import useDebounce from "@/hooks/useDebounce";
import { useSupabase } from "@/lib/supabaseClient";

export default function CreateAppDialog() {
  const supabase = useSupabase();
  const router = useRouter();
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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
      // TODO show snackbar
      throw error ?? Error("No app returned");
    }
    mutate("/apps", (data) => [...(data ?? []), app]);
    setIsCreating(false);
    setOpen(false);
    setAppName("");
    // Can alternatively navigate to the new app
    // router.push(`/app/${app.id}`);
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
        // TODO snackbar
        // showError();
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
    <div>
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
              {isCreating && <LoadingSpinner />}
              <Button
                type="submit"
                disabled={
                  isValidating || validateMessage !== null || isCreating
                }
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
