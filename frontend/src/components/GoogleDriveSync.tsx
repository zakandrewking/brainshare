import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { CircularProgress, Fade, ListItemIcon } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Database } from "../database.types";
import supabase, { useAuth } from "../supabase";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive from "../hooks/useGoogleDrive";

type SyncedFile = Database["public"]["Tables"]["synced_file"]["Row"];

interface GoogleFile {
  remoteId: string;
  name: string;
  parents: string[];
  size: string;
  isFolder: boolean;
  mimeType: string;
}

// a type for combining the synced file and the google file
interface FolderFile {
  remoteId: string | null;
  remoteFolderId: string;
  syncedFile?: SyncedFile;
  googleFile?: GoogleFile;
}

interface FolderToFiles {
  // we use remote as the key because it's available in both sources
  [remoteFolderId: string]: FolderFile[];
}

/**
 * Hook that extends useState to include a loading state. When initialized,
 * isLoading is true. When the state is set, isLoading is false. Initial state
 * is always null. State type includes null. Set state to null to indicate
 * failure.
 */
function useStateOrLoading<T>(): [
  T | null,
  (state: T | null) => void,
  boolean
] {
  const [state, setState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setStateExtended = (state: T | null) => {
    setState(state);
    setIsLoading(false);
  };
  return [state, setStateExtended, isLoading];
}

export default function GoogleDriveSync(): JSX.Element {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorBar();
  const google = useGoogleDrive();

  // const [googleFolderFiles, setGoogleFolderFiles, isLoadingGoogleFileFolders] =
  //   useStateOrLoading<FolderFile[]>();

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
    "/synced_folder?source=google_drive&join=synced_file",
    async () => {
      const { data, error } = await supabase
        .from("synced_folder")
        .select("*, synced_file(*)")
        .filter("source", "eq", "google_drive")
        .returns<SyncedFolderWithFiles>();
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

  // -----------------
  // load google drive
  // -----------------

  // Google Drive - Fetch files when synced folders change
  const {
    data: googleFolderFiles,
    error: errorGoogleFolderFiles,
    isValidating: isValidatingGoogleFolderFiles,
    mutate: mutateGoogleFolderFiles,
  } = useSWR(
    "/google-drive-folder-files",
    async () => {
      if (
        !google.gapi ||
        syncedFolders === undefined ||
        syncedFolders.length === 0
      ) {
        return;
      }
      // get the files
      const { result } = await google.gapi.client.request({
        path: "/drive/v3/files",
        params: {
          // get files with parents in the synced folders
          q:
            "(" +
            syncedFolders
              ?.map((folder) => `'${folder.remote_id}' in parents`)
              .join(" or ") +
            ") and mimeType != 'application/vnd.google-apps.folder'",
          fields: "files(id, name, parents, size, mimeType)",
          pageSize: 100,
        },
        headers: {
          Authorization: `Bearer ${google.accessToken}`,
        },
      });
      // cast the result
      const files: GoogleFile[] = result.files.map(
        (x: any) =>
          ({
            remoteId: x.id,
            name: x.name,
            parents: x.parents,
            size: x.size,
            isFolder: x.mimeType === "application/vnd.google-apps.folder",
            mimeType: x.mimeType,
          } as GoogleFile)
      );
      // group into folders keyed with the remote folder ID
      const folderFiles = files.map((file) => ({
        googleFile: file,
        //   TODO other parents?
        remoteFolderId: file.parents[0],
        remoteId: file.remoteId,
      }));
      return folderFiles;
    },
    {
      // once google.gapi is ready, then we reload the files, with useEffect
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  useEffect(() => {
    if (google.gapi !== null) mutateGoogleFolderFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google.gapi]);

  // ----------------
  // realtime updates
  // ----------------

  useEffect(() => {
    if (!session) return;
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

  // load files from both google and supabase. Combine the results here. If
  // google is down, remain functional with an error message. If supabase is
  // down, abandon hope. Don't want to load the files from the backend because
  // that's slow and annoying if there's a queue; user should be able to jump or
  // reset the queue and prioritize new files from Drive. Biggest question is
  // how to paginate. Easier with infinite scroll. For now, load everything,
  // within limit for Drive so we don't get slammed.

  // for looking up the synced folder ID from the remote ID when we are grouping
  // drive files
  const syncedFolderRemoteIdToId = syncedFolders?.reduce((acc, folder) => {
    return {
      ...acc,
      [folder.remote_id]: folder.id,
    };
  }, {} as { [remoteId: string]: number });

  // make a list of the files along with their remote folder IDs
  const syncedFolderFiles: FolderFile[] = R.pipe(
    syncedFolders ?? [],
    R.map((folder) =>
      folder.synced_file.map((file) => ({
        syncedFile: file,
        remoteFolderId: folder.remote_id,
        remoteId: file.remote_id,
      }))
    ),
    R.flatten()
  );

  // combine supabase results with drive results
  const folderToFiles: FolderToFiles = R.pipe(
    R.concat(syncedFolderFiles, googleFolderFiles ?? []),
    R.filter((ff) => ff.remoteId !== null),
    R.groupBy((ff) => ff.remoteId ?? ""),
    (ffs) => Object.values(ffs),
    R.map((ffs) => R.mergeAll(ffs) as FolderFile),
    R.groupBy((x) => x.remoteFolderId)
  );

  // ----------------
  // Effect functions
  // ----------------

  // navigate to the file and create the synced file if it doesn't exist
  const navigateToFile = async (file: FolderFile) => {
    if (!file.syncedFile) {
      const { data, error } = await supabase
        .from("synced_file")
        .insert({
          name: file.googleFile?.name ?? "",
          mime_type: file.googleFile?.mimeType ?? "application/octet-stream",
          remote_id: file.googleFile?.remoteId,
          source: "google_drive",
          user_id: session!.user.id,
          synced_folder_id: syncedFolderRemoteIdToId![file.remoteFolderId],
        })
        .select("id")
        .single();
      if (data !== null) {
        navigate(`/file/${data.id}`);
      } else {
        if (error) console.error(error);
        showError();
      }
    } else {
      navigate(`/file/${file.syncedFile.id}`);
    }
  };

  // ----------------
  // Render
  // ----------------

  const isLoading =
    isLoadingSyncedFolders || isValidatingGoogleFolderFiles || google.isLoading;

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
                <FolderRoundedIcon />
              </ListItemIcon>
              {folder.name}
            </ListItem>
            {!isLoading && !(folderToFiles[folder.remote_id]?.length > 0) && (
              <ListItem>
                <Typography sx={{ marginLeft: "10px" }}>
                  No files in this folder
                </Typography>
              </ListItem>
            )}
            {folderToFiles[folder.remote_id]?.map((file, j) => (
              <ListItem key={j}>
                <Button
                  sx={{
                    display: "flex",
                    marginRight: "20px",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                  onClick={() => navigateToFile(file)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      ...(file?.syncedFile?.deleted && {
                        textDecoration: "line-through",
                      }),
                    }}
                  >
                    <ListItemIcon>
                      <InsertDriveFileRoundedIcon />
                    </ListItemIcon>
                    {file.googleFile?.name || file.syncedFile?.name || ""}
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
                    {file.googleFile && (
                      <CloudQueueRoundedIcon sx={{ marginRight: "5px" }} />
                    )}
                    {/* ) : googleFileStatus(file.id) === "processing" ? (
                        <>
                          <SyncRoundedIcon sx={{ marginRight: "3px" }} />
                          Processing
                        </>
                      ) : ( */}
                  </Box>
                </Button>
              </ListItem>
            ))}
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
        {(google.error !== null || errorGoogleFolderFiles) && (
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
