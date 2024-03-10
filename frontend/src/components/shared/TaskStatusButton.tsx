import { useEffect } from "react";
import useSWR from "swr";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";

import { Database } from "../../database.types";
import useErrorBar from "../../hooks/useErrorBar";
import supabase, { useAuth } from "../../supabase";
import RotatingRefreshRoundedIcon from "./RotatingRefreshRoundedIcon";

type TaskLinkType = Database["public"]["Tables"]["task_link"]["Row"];

export default function TaskStatusButton({
  taskLinkRefTable,
  taskLinkRefColumn,
  taskLinkRefId,
  taskType,
  handleCreateTask,
}: {
  taskLinkRefTable: string;
  taskLinkRefColumn: string;
  taskLinkRefId: number;
  taskType: string;
  handleCreateTask: (clean_up_only?: boolean) => Promise<void>;
}) {
  // -----
  // Hooks
  // -----

  const { session } = useAuth();
  const { showError } = useErrorBar();

  // ------------
  // Data loading
  // ------------

  const {
    data: taskLink,
    isLoading: isLoadingTaskLink,
    mutate: taskLinkMutate,
  } = useSWR(
    `/task_link/from/${taskLinkRefTable}/${taskLinkRefColumn}`,
    async () => {
      const { data, error } = await supabase
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
    if (!session) return;

    const channel = supabase
      .channel("task-link-changes")
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
  }, [session, taskLinkMutate, taskType]);

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
    <Box>
      <IconButton
        onClick={handleUpdate}
        sx={{ ml: "20px" }}
        disabled={Boolean(hasActiveSync)}
      >
        {hasActiveSync ? (
          <RotatingRefreshRoundedIcon />
        ) : hasError ? (
          <Tooltip title="Could not sync the folder. Click to try again.">
            <ErrorOutlineRoundedIcon />
          </Tooltip>
        ) : (
          <Tooltip title="Folder is up to date. Click to sync again.">
            <CheckCircleOutlineRoundedIcon />
          </Tooltip>
        )}
      </IconButton>
      {taskLink?.task_finished_at && (
        <Typography variant="caption" sx={{ opacity: 0.4, ml: "4px" }}>
          Last synced{" "}
          {new Date(taskLink.task_finished_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            // TODO LEFT OFF add timezone
          })}
        </Typography>
      )}
    </Box>
  );
}
