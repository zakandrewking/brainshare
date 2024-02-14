/**
 * Design Spec: Use this for loading a list of items
 */

import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  CircularProgress,
  Container,
  Fade,
  IconButton,
  Link,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";

import { DefaultService } from "../client";
import { Database } from "../database.types";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";

type SyncedFile = Database["public"]["Tables"]["synced_file"]["Row"];
type TaskLinkType = Database["public"]["Tables"]["task_link"]["Row"];

const RotatingRefreshRoundedIcon = styled(RefreshRoundedIcon)(
  () => `
  animation: spin 2s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`
);

// a type for combining the synced file and the google file
interface FolderFile {
  remoteId: string | null;
  syncedFolderRemoteId: string;
  syncedFile: SyncedFile;
}

interface FolderToFiles {
  // we use remote as the key because it's available in both sources
  [syncedFolderRemoteId: string]: FolderFile[];
}

// can drop after https://github.com/supabase/cli/issues/736
type SyncedFolderWithFiles =
  Database["public"]["Tables"]["synced_folder"]["Row"] & {
    synced_file: SyncedFile[];
  } & {
    task_link: TaskLinkType | null;
  };

function folderHasActiveSync(folder: SyncedFolderWithFiles): boolean {
  return (
    folder.task_link !== null && folder.task_link.task_finished_at === null
  );
}

function folderHasSyncError(folder: SyncedFolderWithFiles): boolean {
  return folder.task_link !== null && folder.task_link.task_error !== null;
}

export default function FileList() {
  // -----
  // Hooks
  // -----

  const { session } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();
  const google = useGoogleDrive();

  // if ID is undefined, then this is the top level
  const { id } = useParams();
  const syncedFileFolderId = id ? Number(id) : undefined;
  const [hasCleanedUp, setHasCleanedUp] = useState(false);
  const [isFolderRealtimeReady, setIsFolderRealtimeReady] = useState(false);
  const [isFileRealtimeReady, setIsFileRealtimeReady] = useState(false);

  // ------------
  // Data loading
  // ------------

  // load the synced folders
  const syncedFolderKey =
    "/synced_folder?source=google_drive&join=synced_file" +
    (syncedFileFolderId ? `&parent_folder_id=${syncedFileFolderId}` : "");
  const {
    data: syncedFolders,
    isValidating: isLoadingSyncedFolders,
    error: syncedFoldersError,
    mutate: syncedFoldersMutate,
  } = useSWR(
    syncedFolderKey,
    async () => {
      var stmt = supabase
        .from("synced_folder")
        .select("*, synced_file(*), task_link(*)")
        .filter("source", "eq", "google_drive")
        .filter("synced_file.deleted", "eq", false);
      if (syncedFileFolderId) {
        // we want to get info on the current folder and its children
        stmt = stmt.or(
          `id.eq.${syncedFileFolderId}, parent_ids.cs.{${syncedFileFolderId}}`,
          { foreignTable: "synced_file" }
        );
      } else {
        // -1 indicates root
        stmt = stmt.contains("synced_file.parent_ids", [-1]);
      }
      const { data, error } = await stmt.returns<SyncedFolderWithFiles>();
      if (error) throw error;
      return data;
    },
    {
      // will update with realtime
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  console.log(syncedFolders);

  // ----------------
  // Realtime updates
  // ----------------

  useEffect(() => {
    if (!session) return;

    // folder status changes
    const channelFolder = supabase
      .channel("synced-folder-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "synced_folder",
        },
        (payload) => {
          return syncedFoldersMutate(
            (folders) => {
              const newFolders = folders?.map((folder) => {
                if (folder.id === payload.new?.id) {
                  return {
                    ...folder,
                    ...payload.new,
                  };
                } else {
                  return folder;
                }
              });
              return newFolders;
            },
            { revalidate: false }
          );
        }
      )
      .subscribe(() => setIsFolderRealtimeReady(true));

    // file changes
    const channel = supabase
      .channel("synced-file-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "synced_file",
        },
        (payload) => {
          // the filter we need is for any file whose parent_ids contains the
          // root (-1). on() doesn't support this, so we'll filter in the
          // callback
          if (syncedFileFolderId) {
            // we want to get info on the current folder and its children
            if (
              !(
                payload.new.id === syncedFileFolderId ||
                payload.new.parent_ids.includes(syncedFileFolderId)
              )
            ) {
              return;
            }
          } else {
            if (!payload.new.parent_ids.includes(-1)) {
              return;
            }
          }
          return syncedFoldersMutate(
            (folders) => {
              // if the file is deleted, then drop it
              if (payload.new?.deleted) {
                return folders?.map((folder) => {
                  return {
                    ...folder,
                    synced_file: folder.synced_file.filter(
                      (file) => file.id !== payload.new?.id
                    ),
                  };
                });
              } else {
                const newFolders = folders?.map((folder) => {
                  return {
                    ...folder,
                    synced_file: folder.synced_file.map((file) =>
                      file.id === payload.new?.id
                        ? (payload.new as SyncedFile)
                        : file
                    ),
                  };
                });
                return newFolders;
              }
            },
            { revalidate: false }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "synced_file",
        },
        (payload) => {
          // the filter we need is for any file whose parent_ids contains the
          // root (-1). on() doesn't support this, so we'll filter in the
          // callback
          if (syncedFileFolderId) {
            // we want to get info on the current folder and its children
            if (!payload.new.parent_ids.includes(syncedFileFolderId)) {
              return;
            }
          } else {
            if (!payload.new.parent_ids.includes(-1)) {
              return;
            }
          }
          return syncedFoldersMutate(
            (folders) => {
              const newFolders = folders?.map((folder) => {
                return {
                  ...folder,
                  synced_file: [
                    ...folder.synced_file,
                    payload.new as SyncedFile,
                  ],
                };
              });
              return newFolders;
            },
            { revalidate: false }
          );
        }
      )
      .subscribe(() => setIsFileRealtimeReady(true));

    return () => {
      channel.unsubscribe();
      channelFolder.unsubscribe();
    };
    // Don't update this subscription too often or we miss data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the realtime subscriptions are ready and we have data loaded, check
  // that jobs are done
  // TODO is there really not a more generic place to do this?
  useEffect(() => {
    if (
      !syncedFolders ||
      !isFolderRealtimeReady ||
      !isFileRealtimeReady ||
      hasCleanedUp
    ) {
      return;
    }
    setHasCleanedUp(true);
    syncedFolders?.forEach(async (folder) => {
      if (folder.sync_folder_task_link_id) {
        try {
          await DefaultService.postTaskSyncFolder({
            synced_folder_id: folder.id,
            synced_file_folder_id: syncedFileFolderId,
            // TODO not recursive, right?
            clean_up_only: true,
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  }, [
    syncedFolders,
    isFolderRealtimeReady,
    isFileRealtimeReady,
    hasCleanedUp,
    syncedFileFolderId,
  ]);

  // --------
  // Handlers
  // --------

  const handleUpdateFolder = async (
    syncedFolderId: number,
    syncedFileFolderId?: number
  ) => {
    try {
      await DefaultService.postTaskSyncFolder({
        synced_folder_id: syncedFolderId,
        synced_file_folder_id: syncedFileFolderId,
      });
    } catch (error) {
      console.error(error);
      showError();
      return;
    }
  };

  // ------------------
  // Computed variables
  // ------------------

  // make a list of the files along with their remote folder IDs
  const syncedFolderFiles: FolderFile[] = R.pipe(
    syncedFolders ?? [],
    R.map((folder) =>
      folder.synced_file.map((file) => ({
        syncedFile: file,
        syncedFolderRemoteId: folder.remote_id,
        remoteId: file.remote_id,
      }))
    ),
    R.flatten()
  );

  // combine supabase results with drive results
  const folderToFiles: FolderToFiles = R.pipe(
    // TODO if we don't need google loading here, we can sure simplify this
    // R.concat(syncedFolderFiles, googleFolderFiles ?? []),
    R.concat(syncedFolderFiles, []),
    R.filter((ff) => ff.remoteId !== null),
    R.groupBy((ff) => ff.remoteId ?? ""),
    (ffs) => Object.values(ffs),
    R.map((ffs) => R.mergeAll(ffs) as FolderFile),
    R.groupBy((x) => x.syncedFolderRemoteId)
  );

  const isLoading = isLoadingSyncedFolders || google.isLoading;

  const noFoldersSynced =
    !isLoading &&
    syncedFoldersError === null &&
    google.error === null &&
    syncedFolders?.length === 0;

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

  if (!session) {
    return (
      <Container>
        <Typography variant="h4">Files</Typography>
        <Button
          sx={{ marginTop: "30px" }}
          variant="outlined"
          component={RouterLink}
          to="/log-in?redirect=/files"
        >
          Log in
        </Button>
      </Container>
    );
  }

  // ---------------
  // Redirect checks
  // ---------------

  // if this is a nested folder, make sure it's not a file. we have a button
  // instead of navigating to avoid an infinite loop
  if (syncedFileFolderId) {
    syncedFolders?.forEach((folder) => {
      folder.synced_file.forEach((file) => {
        if (file.id === Number(syncedFileFolderId) && !file.is_folder) {
          return (
            <Container>
              <Button component={RouterLink} to={`/file/${syncedFileFolderId}`}>
                This looks like a file. Click here to view it.
              </Button>
            </Container>
          );
        }
      });
    });
  }

  // ------
  // Render
  // ------

  // TODO top level components should render a succinct set of components
  return (
    <Container>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h4">Files</Typography>
        <Button onClick={() => navigate("/account/google-drive")}>
          <SettingsRoundedIcon sx={{ marginRight: 1 }} />
          Configure Google Drive
        </Button>
      </Stack>
      <Stack direction="column" spacing={2} alignItems="start">
        {/* No folders synced */}
        {noFoldersSynced && <Typography>No folders are synced. </Typography>}

        {/* Folders list */}
        {syncedFolders?.map((folder, i) => {
          // if this is a synced file folder, grab that object
          const syncedFileFolder = folderToFiles[folder.remote_id]?.find(
            (ff) => ff.syncedFile.id === syncedFileFolderId
          );

          return (
            <Fragment key={i}>
              <Stack direction="row" alignItems="center" flexWrap="wrap">
                {syncedFileFolderId ? (
                  <Stack direction="row" flexWrap="wrap" rowGap="20px">
                    <Stack
                      direction="row"
                      alignItems="center"
                      flexWrap="nowrap"
                    >
                      <ListItemIcon>
                        <FolderSpecialRoundedIcon />
                      </ListItemIcon>
                      <Link
                        component={RouterLink}
                        to="/files"
                        sx={{ color: "inherit" }}
                      >
                        {folder.name}
                      </Link>
                    </Stack>
                    <Box sx={{ mx: 5 }}>...</Box>
                    <Stack
                      direction="row"
                      alignItems="center"
                      flexWrap="nowrap"
                    >
                      <ListItemIcon>
                        <FolderRoundedIcon />
                      </ListItemIcon>
                      {syncedFileFolder?.syncedFile.name}
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    <ListItemIcon>
                      <FolderSpecialRoundedIcon />
                    </ListItemIcon>
                    {folder.name}
                  </>
                )}
                <IconButton
                  onClick={() =>
                    handleUpdateFolder(folder.id, syncedFileFolderId)
                  }
                  sx={{ ml: "20px" }}
                  disabled={folderHasActiveSync(folder) ? true : false}
                >
                  {folderHasActiveSync(folder) ? (
                    <RotatingRefreshRoundedIcon />
                  ) : folderHasSyncError(folder) ? (
                    <Tooltip title="Could not sync the folder. Click to try again.">
                      <ErrorOutlineRoundedIcon />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Folder is up to date. Click to sync again.">
                      <CheckCircleOutlineRoundedIcon />
                    </Tooltip>
                  )}
                </IconButton>
              </Stack>
              {!isLoading && !(folderToFiles[folder.remote_id]?.length > 0) && (
                <Typography sx={{ marginLeft: "10px" }}>
                  No files in this folder
                </Typography>
              )}
              <List sx={{ ml: "15px", width: "100%" }}>
                {folderToFiles[folder.remote_id]?.map((file, j) => {
                  if (file.syncedFile.id === syncedFileFolderId) {
                    // The parent file in this view will be shown above with the
                    // Synced Folder
                    return <Fragment key={-1}></Fragment>;
                  }
                  return (
                    <ListItemButton
                      key={j}
                      sx={{
                        ":first-of-type": {
                          borderTop: "1px solid",
                        },
                        borderBottom: "1px solid",
                        display: "flex",
                        marginRight: "20px",
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                      component={RouterLink}
                      to={
                        file.syncedFile.is_folder
                          ? `/file/folder/${file.syncedFile.id}`
                          : `/file/${file.syncedFile.id}`
                      }
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          overflowWrap: "anywhere",
                          ...(file?.syncedFile?.deleted && {
                            textDecoration: "line-through",
                          }),
                        }}
                      >
                        <ListItemIcon>
                          {file.syncedFile.is_folder ? (
                            <FolderRoundedIcon />
                          ) : (
                            <InsertDriveFileRoundedIcon />
                          )}
                        </ListItemIcon>
                        {file.syncedFile.name}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        {file.syncedFile && (
                          <CheckRoundedIcon sx={{ marginRight: "3px" }} />
                        )}
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            </Fragment>
          );
        })}

        {/* Errors */}
        {!google.isLoading &&
          google.error === null &&
          google.accessToken === null && (
            <ListItem sx={{ marginTop: "30px" }}>
              Could not access Google Drive ...
              <Button
                variant="outlined"
                component={RouterLink}
                to="/account/google-drive"
                sx={{ marginLeft: "10px" }}
              >
                Reconnect
              </Button>
            </ListItem>
          )}
        {google.error !== null && (
          <ListItem sx={{ marginTop: "30px" }}>
            Could not access Google Drive. Please try again later.
          </ListItem>
        )}

        {/* Progress */}
        {isLoading && (
          <Fade
            in={isLoading}
            style={{
              transitionDelay: isLoading ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        )}
      </Stack>
    </Container>
  );
}
