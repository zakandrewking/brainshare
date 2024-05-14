"use client";

import { CircleCheck, ShieldAlert } from "lucide-react";
import { useEffect, useId } from "react";
import useSWR from "swr";

import { Database } from "@/database.types";
import { useSupabase } from "@/lib/supabaseClient";

import { showError } from "./error";
import { Button } from "./ui/button";
import { LoadingSpinner } from "./ui/loading";
import { Stack } from "./ui/stack";
import { TextTooltip } from "./ui/tooltip";

type TaskLinkType = Database["public"]["Tables"]["task_link"]["Row"];

export function TaskStatusButton({
  taskLinkRefTable,
  taskLinkRefColumn,
  taskLinkRefId,
  taskType,
  handleCreateTask,
}: {
  taskLinkRefTable: string;
  taskLinkRefColumn: string;
  taskLinkRefId: string;
  taskType: string;
  handleCreateTask: (cleanUpOnly?: boolean) => Promise<void>;
}) {
  const componentId = useId();
  const supabase = useSupabase();

  // ------------
  // Data loading
  // ------------

  const { data: taskLink, mutate: taskLinkMutate } = useSWR(
    supabase &&
      `/task_link/from/${taskLinkRefTable}/${taskLinkRefId}/${taskLinkRefColumn}`,
    async () => {
      const { data, error } = await supabase!
        .from("task_link")
        .select(`*, ${taskLinkRefTable}!inner!${taskLinkRefColumn}(id)`)
        .eq(`${taskLinkRefTable}.id`, taskLinkRefId)
        .returns<TaskLinkType[]>()
        .maybeSingle();
      if (error) {
        console.error(error);
        throw Error("Could not fetch task link");
      }
      return data;
    },
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // ----------------
  // Realtime updates
  // ----------------

  // Realtime updates are expensive (esp. with RLS and filters), so we design a
  // few tables that have the key events we need to update the view. e.g. File
  // updates are handled in an async task, so when the task finishes, we can
  // revalidate the file list.

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`task-link-changes-${componentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "task_link",
          filter: `type=eq.${taskType}`,
        },
        () => {
          taskLinkMutate();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [componentId, supabase, taskLinkMutate, taskType]);

  // ------------------
  // Computed variables
  // ------------------

  const hasActiveSync = taskLink && taskLink.task_finished_at === null;
  const hasError = taskLink && taskLink.task_error !== null;

  // -------------------
  // Derived data loader
  // -------------------

  // The celery backend (redis) knows which tasks have finished, with error info
  // for failed jobs. Successful tasks write an update back to postgres as a
  // final step in the task. But, for failures, we don't proactively write error
  // messages back to postgres. (NOTE: we could use postgres as the celery
  // backend, but that's tying the services together.)
  //
  // So, when the component mounts, we'll poll the celery backend for the task
  // status and write the error message to postgres if the task failed.
  //
  // If we want to take the frontend out of the equation, we can set up a
  // service to poll the celery backend and write error messages to postgres,
  // but UX improvements may not merit the effort. Nothing wrong with scheduling
  // that job in celery.
  useSWR(
    // only clean up if the task is not finished
    hasActiveSync
      ? `/task_link/from/${taskLinkRefTable}/${taskLinkRefColumn}/cleanup`
      : null,
    async () => {
      await handleCreateTask(true);
    },
    {
      // call again when the component mounts and every 10 seconds
      revalidateIfStale: true,
      refreshInterval: 10 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // --------
  // Handlers
  // --------

  const handleUpdate = async () => {
    try {
      // This should synchronously update the task link so we can revalidate and
      // retrieve it
      await handleCreateTask();
    } catch (error) {
      showError();
      console.error(error);
      throw Error("Could not sync the folder");
    }
    taskLinkMutate();
  };

  // ------
  // Render
  // ------

  return (
    <Stack direction="row">
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={handleUpdate}
        disabled={Boolean(hasActiveSync)}
      >
        {hasActiveSync ? (
          <LoadingSpinner />
        ) : hasError ? (
          <TextTooltip text="Could not sync the folder. Click to try again.">
            <ShieldAlert />
          </TextTooltip>
        ) : (
          <TextTooltip text="Folder is up to date. Click to sync again.">
            <CircleCheck />
          </TextTooltip>
        )}
      </Button>
      {taskLink?.task_finished_at && (
        <>
          Last synced{" "}
          {new Date(taskLink.task_finished_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })}
        </>
      )}
    </Stack>
  );
}
