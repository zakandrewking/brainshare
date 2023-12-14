import { Fragment, useEffect } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
// import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  CircularProgress,
  Container,
  Fade,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DefaultService } from "../client";
import { Database } from "../database.types";
import useErrorBar from "../hooks/useErrorBar";
// import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";

type SyncedFile = Database["public"]["Tables"]["synced_file"]["Row"];

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

export default function GoogleDriveSync(): JSX.Element {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();
  const google = useGoogleDrive();

  // if ID is undefined, then this is the top level
  const { id } = useParams();
  const syncedFileFolderId = Number(id);

  // -------------------
  // load synced folders
  // -------------------

  // can drop after https://github.com/supabase/cli/issues/736
  type SyncedFolderWithFiles =
    Database["public"]["Tables"]["synced_folder"]["Row"] & {
      synced_file: SyncedFile[];
    };

  // load the synced folders -- google only for now
  const {
    data: syncedFolders,
    isValidating: isLoadingSyncedFolders,
    error: syncedFoldersError,
    mutate: syncedFoldersMutate,
  } = useSWR(
    `/synced_folder?source=google_drive&join=synced_file&parent_folder_id=${syncedFileFolderId}`,
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

  // -----------------
  // load google drive
  // -----------------

  // // Google Drive - Fetch files when synced folders change
  // const {
  //   data: googleFolderFiles,
  //   error: errorGoogleFolderFiles,
  //   isValidating: isValidatingGoogleFolderFiles,
  //   mutate: mutateGoogleFolderFiles,
  // } = useSWR(
  //   "/google-drive-folder-files",
  //   async () => {
  //     if (
  //       !google.gapi ||
  //       syncedFolders === undefined ||
  //       syncedFolders.length === 0
  //     ) {
  //       return;
  //     }
  //     // get the files
  //     const { result } = await google.gapi.client.request({
  //       path: "/drive/v3/files",
  //       params: {
  //         // get files with parents in the synced folders
  //         q:
  //           "(" +
  //           syncedFolders
  //             ?.map((folder) => `'${folder.remote_id}' in parents`)
  //             .join(" or ") +
  //           ")",
  //         fields: "files(id, name, parents, size, mimeType)",
  //         pageSize: 100,
  //       },
  //       headers: {
  //         Authorization: `Bearer ${google.accessToken}`,
  //       },
  //     });
  //     // cast the result
  //     const files: GoogleFile[] = result.files.map(
  //       (x: any) =>
  //         ({
  //           remoteId: x.id,
  //           name: x.name,
  //           parents: x.parents,
  //           size: x.size,
  //           isFolder: x.mimeType === "application/vnd.google-apps.folder",
  //           mimeType: x.mimeType,
  //         } as GoogleFile)
  //     );
  //     // group into folders keyed with the remote folder ID
  //     const folderFiles = files.map((file) => ({
  //       googleFile: file,
  //       //   TODO other parents?
  //       remoteFolderId: file.parents[0],
  //       remoteId: file.remoteId,
  //     }));
  //     return folderFiles;
  //   },
  //   {
  //     // once google.gapi is ready, then we reload the files, with useEffect
  //     revalidateIfStale: false,
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   }
  // );
  // useEffect(() => {
  //   if (google.gapi !== null) mutateGoogleFolderFiles();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [google.gapi]);

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
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [session, syncedFolders, syncedFoldersMutate]);

  // ----------------
  // process data
  // ----------------

  // old notes: load files from both google and supabase. Combine the results
  // here. If google is down, remain functional with an error message. If
  // supabase is down, abandon hope. Don't want to load the files from the
  // backend because that's slow and annoying if there's a queue; user should be
  // able to jump or reset the queue and prioritize new files from Drive.
  // Biggest question is how to paginate. Easier with infinite scroll. For now,
  // load everything, within limit for Drive so we don't get slammed.

  // for looking up the synced folder ID from the remote ID when we are grouping
  // drive files
  // const syncedFolderRemoteIdToId = syncedFolders?.reduce((acc, folder) => {
  //   return {
  //     ...acc,
  //     [folder.remote_id]: folder.id,
  //   };
  // }, {} as { [remoteId: string]: number });

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
      DefaultService.postRunUpdateSyncedFolder({
        synced_folder_id: syncedFolderId,
        synced_file_folder_id: syncedFileFolderId,
      });
    } catch (error) {
      console.error(error);
      showError();
      return;
    }
    // if it succeeds, revalidate the folder
    syncedFoldersMutate();
  };

  // navigate to the file and create the synced file if it doesn't exist
  // const navigateToFile = async (file: FolderFile) => {
  // if (!file.syncedFile) {
  //   const { data, error } = await supabase
  //     .from("synced_file")
  //     .insert({
  //       name: file.googleFile?.name ?? "",
  //       mime_type: file.googleFile?.mimeType ?? "application/octet-stream",
  //       remote_id: file.googleFile?.remoteId,
  //       source: "google_drive",
  //       user_id: session!.user.id,
  //       synced_folder_id: syncedFolderRemoteIdToId![file.remoteFolderId],
  //       is_folder: file.googleFile?.isFolder ?? false,
  //       parents: _getParents(),
  //     })
  //     .select("id")
  //     .single();
  //   if (data !== null) {
  //     if (file.googleFile?.isFolder) {
  //       navigate(`/files/folder/${data.id}`);
  //     } else {
  //       navigate(`/files/${data.id}`);
  //     }
  //   } else {
  //     if (error) console.error(error);
  //     showError();
  //   }
  // } else {
  // if (file.syncedFile.is_folder) {
  //   navigate(`/files/folder/${file.syncedFile.id}`);
  // } else {
  //   navigate(`/files/${file.syncedFile.id}`);
  // }
  // }
  // };

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
              {/* refresh button */}
              <ListItemButton
                onClick={() => updateFolder(folder.id, syncedFileFolderId)}
              ></ListItemButton>
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
                    {/* {file.googleFile && (
                      <CloudQueueRoundedIcon sx={{ marginRight: "5px" }} />
                    )} */}
                    {/* ) : googleFileStatus(file.id) === "processing" ? (
                        <>
                          <SyncRoundedIcon sx={{ marginRight: "3px" }} />
                          Processing
                        </>
                      ) : ( */}
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
