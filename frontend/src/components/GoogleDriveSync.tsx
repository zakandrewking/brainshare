import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
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
  ListItemButton,
  ListItemIcon,
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
// import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
import useTask from "../hooks/useJob";
import { useAsyncEffect } from "../hooks/useAsyncEffect";

type SyncedFile = Database["public"]["Tables"]["synced_file"]["Row"];

const RotatingRefreshRoundedIcon = styled(RefreshRoundedIcon)(
  ({ theme }) => `
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

// interface GoogleFile {
//   remoteId: string;
//   name: string;
//   // array of parent remote folder IDs
//   parentIds: string[];
//   size: string;
//   isFolder: boolean;
//   mimeType: string;
// }

// a type for combining the synced file and the google file
interface FolderFile {
  remoteId: string | null;
  syncedFolderRemoteId: string;
  syncedFile: SyncedFile;
  // syncedFile?: SyncedFile;
  // googleFile?: GoogleFile;
}

interface FolderToFiles {
  // we use remote as the key because it's available in both sources
  [syncedFolderRemoteId: string]: FolderFile[];
}

interface UpdateJob {
  syncedFolderId: number;
  jobId: number;
}

export default function GoogleDriveSync(): JSX.Element {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();
  const google = useGoogleDrive();

  // if ID is undefined, then this is the top level
  const { id } = useParams();
  const syncedFileFolderId = id ? Number(id) : undefined;
  const [isUpdatingJob, setIsUpdatingJob] = useState<UpdateJob | null>(null);
  const [hasCleanedUp, setHasCleanedUp] = useState(false);

  // -------------------
  // load synced folders
  // -------------------

  // can drop after https://github.com/supabase/cli/issues/736
  type SyncedFolderWithFiles =
    Database["public"]["Tables"]["synced_folder"]["Row"] & {
      synced_file: SyncedFile[];
    };

  // load the synced folders
  const {
    data: syncedFolders,
    isValidating: isLoadingSyncedFolders,
    error: syncedFoldersError,
    mutate: syncedFoldersMutate,
  } = useSWR(
    "/synced_folder?source=google_drive&join=synced_file" +
      (syncedFileFolderId ? `&parent_folder_id=${syncedFileFolderId}` : ""),
    async () => {
      var stmt = supabase
        .from("synced_folder")
        .select("*, synced_file(*)")
        .filter("source", "eq", "google_drive");
      if (syncedFileFolderId) {
        // we want to get info on the current folder and its children
        stmt = stmt.or(
          `id.eq.${syncedFileFolderId}, parent_ids.cs{${syncedFileFolderId}}`,
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

  // if this is a nested folder, make sure it's not a file. we have about
  // instead of navigating to avoid an infinite loop
  if (syncedFileFolderId) {
    syncedFolders?.forEach((folder) => {
      folder.synced_file.forEach((file) => {
        if (file.id === Number(syncedFileFolderId) && !file.is_folder) {
          return (
            <Container>
              <Button
                component={RouterLink}
                to={`/files/${syncedFileFolderId}`}
              >
                This looks like a file. Click here to view it.
              </Button>
            </Container>
          );
        }
      });
    });
  }

  // ----------------
  // realtime updates
  // ----------------

  useEffect(() => {
    if (!session) return;

    // TODO notify if any files in this folder are deleted?

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
          const newSyncedFolders = syncedFolders?.map((folder) => {
            return {
              ...folder,
              synced_file: folder.synced_file.map((file) =>
                file.id === payload.new?.id ? (payload.new as SyncedFile) : file
              ),
            };
          });
          syncedFoldersMutate(newSyncedFolders, false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "synced_file",
          // TODO filter by parent folder
        },
        (payload) => {
          const newSyncedFolders = syncedFolders?.map((folder) => {
            return {
              ...folder,
              synced_file: [...folder.synced_file, payload.new as SyncedFile],
            };
          });
          syncedFoldersMutate(newSyncedFolders, false);
        }
      )
      .subscribe(async (status) => {
        // if there are any jobs processing right when we load the page, we want to
        // double check their status. only do this once
        // TODO pull into a useTask hook
        console.log("here", status, syncedFolders, hasCleanedUp);
        if (status === "SUBSCRIBED" && syncedFolders && !hasCleanedUp) {
          setHasCleanedUp(true);
          syncedFolders?.forEach(async (folder) => {
            if (folder.update_task_id) {
              try {
                await DefaultService.postRunUpdateSyncedFolder({
                  synced_folder_id: folder.id,
                  synced_file_folder_id: syncedFileFolderId,
                  clean_up_only: true,
                });
              } catch (error) {
                console.error(error);
              }
            }
          });
        }
      });
    return () => {
      channel.unsubscribe();
    };
  }, [
    hasCleanedUp,
    session,
    syncedFileFolderId,
    syncedFolders,
    syncedFoldersMutate,
  ]);

  // ----------------
  // process data
  // ----------------

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

  // ----------------
  // Effect functions
  // ----------------

  const updateFolder = async (
    syncedFolderId: number,
    syncedFileFolderId?: number
  ) => {
    try {
      // const res = DefaultService.postRunUpdateSyncedFolder({
      //   synced_folder_id: syncedFolderId,
      //   synced_file_folder_id: syncedFileFolderId,
      // });
      //     if (res.error) throw Error(res.error);
      //     isUpdatingJob({ syncedFolderId, jobId });
      //     if (taskId) {
      //       // This will run once immediately and then every few seconds
      //       _checkStatus(taskId);
      //     }
      //     return () => {
      //       if (timeout) clearTimeout(timeout);
      //     };
    } catch (error) {
      console.error(error);
      showError();
      // setIsUpdatingJob(null);
      return;
    }
    //   // if it succeeds, revalidate the folder
    //   syncedFoldersMutate();
  };

  // ----------------
  // Render
  // ----------------

  // TODO why do we get stuck in the loading state when we focus back to the
  // page?
  console.log("focus debugging", isLoadingSyncedFolders, google.isLoading);
  const isLoading = isLoadingSyncedFolders || google.isLoading;
  console.log("isLoading", isLoading);

  const noFoldersSynced =
    !isLoading &&
    syncedFoldersError === null &&
    google.error === null &&
    syncedFolders?.length === 0;

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h4">Files</Typography>
        <Button onClick={() => navigate("/settings/google-drive")}>
          <SettingsRoundedIcon sx={{ marginRight: 1 }} />
          Configure Google Drive
        </Button>
      </Stack>
      <List>
        {/* No folders synced */}
        {noFoldersSynced && (
          <ListItem>
            <Typography>No folders are synced. </Typography>
          </ListItem>
        )}

        {/* Folders list */}
        {syncedFolders?.map((folder, i) => (
          <Fragment key={i}>
            <ListItem key={i}>
              <ListItemIcon>
                <FolderSpecialRoundedIcon />
              </ListItemIcon>
              {folder.name}
              <IconButton
                onClick={() => updateFolder(folder.id, syncedFileFolderId)}
                sx={{ ml: "20px" }}
                disabled={isUpdatingJob !== null}
              >
                {isUpdatingJob?.syncedFolderId === folder.id ? (
                  <RotatingRefreshRoundedIcon />
                ) : (
                  <RefreshRoundedIcon />
                )}
              </IconButton>
            </ListItem>
            {!isLoading && !(folderToFiles[folder.remote_id]?.length > 0) && (
              <ListItem>
                <Typography sx={{ marginLeft: "10px" }}>
                  No files in this folder
                </Typography>
              </ListItem>
            )}
            <List sx={{ ml: "15px" }}>
              {folderToFiles[folder.remote_id]?.map((file, j) => (
                <ListItemButton
                  key={j}
                  sx={{
                    ":first-child": {
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
                      ? `/files/folder/${file.syncedFile.id}`
                      : `/files/${file.syncedFile.id}`
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
              ))}
            </List>
          </Fragment>
        ))}

        {/* Errors */}
        {!google.isLoading &&
          google.error === null &&
          google.accessToken === null && (
            <ListItem sx={{ marginTop: "30px" }}>
              Could not access Google Drive ...
              <Button
                variant="outlined"
                component={RouterLink}
                to="/settings/google-drive"
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
        <ListItem>
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
        </ListItem>
      </List>
    </>
  );
}
