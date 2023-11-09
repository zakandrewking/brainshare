import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { concat, flatten, groupBy, isArray, map, mergeAll, pipe } from "remeda";
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
import supabase, { invoke, useAuth } from "../supabase";
import { useScript } from "../util/useScript";

interface GoogleFile {
  remoteId: string;
  name: string;
  parents: string[];
  size: string;
  isFolder: boolean;
}

interface FolderFile {
  remoteId: string | null;
  remoteFolderId: string;
  syncedFile?: Database["public"]["Tables"]["synced_file"]["Row"];
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

  const gapiLoadingStatus = useScript("https://apis.google.com/js/api.js");
  const [accessToken, setAccessToken, isLoadingAccessToken] =
    useStateOrLoading<string>();
  const [googleFolderFiles, setGoogleFolderFiles, isLoadingGoogleFileFolders] =
    useStateOrLoading<FolderFile[]>();
  const [gapi, setGapi, isLoadingGapi] = useStateOrLoading<any>();

  // load the synced folders -- google only for now
  const {
    data: syncedFolders,
    isValidating: isLoadingSyncedFolders,
    error: syncedFoldersError,
  } = useSWR(
    "/synced_folder?source=google_drive&join=synced_file",
    async () => {
      const { data, error } = await supabase
        .from("synced_folder")
        .select("*, synced_file(*)")
        .filter("source", "eq", "google_drive");
      if (error) {
        console.error(error);
        throw Error("Could not fetch synced folders");
      }
      return data;
    }
  );
  // for looking up the synced folder ID from the remote ID when we are grouping
  // drive files
  const syncedFolderRemoteIdToId = syncedFolders?.reduce((acc, folder) => {
    return {
      ...acc,
      [folder.remote_id]: folder.id,
    };
  }, {} as { [remoteId: string]: number });
  // make an list of the files along with their remote folder IDs
  const syncedFolderFiles: FolderFile[] = pipe(
    syncedFolders ?? [],
    map((folder) =>
      folder.synced_file === null
        ? []
        : isArray(folder.synced_file)
        ? folder.synced_file.map((file) => ({
            syncedFile: file,
            remoteFolderId: folder.remote_id,
            remoteId: file.remote_id,
          }))
        : [
            {
              syncedFile: folder.synced_file,
              remoteFolderId: folder.remote_id,
              remoteId: folder.synced_file.remote_id,
            },
          ]
    ),
    flatten()
  );

  // Google Drive -- check for access token on load
  // TODO wrap google drive in a hook with an API that looks like useSWR
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        // TODO cache this
        const res = await invoke("google-token", "GET");
        if (res.accessToken) {
          setAccessToken(res.accessToken);
        } else if (res.noTokens) {
          setAccessToken(null);
        }
      } catch (error) {
        setAccessToken(null);
        console.log(error);
        throw Error(String(error));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Google Drive -- Set up gapi
  useEffect(() => {
    if (gapiLoadingStatus === "ready") {
      const gapiGlobal = (window as any).gapi;
      gapiGlobal.load("client", () => {
        setGapi(gapiGlobal);
      });
    }
  }, [gapiLoadingStatus, setGapi]);

  // Google Drive - Fetch files when synced folders change
  useEffect(() => {
    (async () => {
      if (!gapi || !accessToken || !session) return;
      try {
        // get the files
        const { result } = await gapi.client.request({
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
            Authorization: `Bearer ${accessToken}`,
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
            } as GoogleFile)
        );
        // group into folders keyed with the remote folder ID
        const folderFiles = files.map((file) => ({
          googleFile: file,
          //   TODO other parents?
          remoteFolderId: file.parents[0],
          remoteId: file.remoteId,
        }));
        setGoogleFolderFiles(folderFiles);
      } catch (error) {
        setGoogleFolderFiles(null);
        console.error(error);
        throw Error("Could not fetch files");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapi, accessToken, session]);

  const toFile = async (file: FolderFile) => {
    console.log(file);
    if (!file.syncedFile) {
      // create the synced file and then navigate there
      const { data, error } = await supabase
        .from("synced_file")
        .insert({
          name: file.googleFile?.name ?? "",
          remote_id: file.googleFile?.remoteId,
          source: "google_drive",
          user_id: session!.user.id,
          synced_folder_id: syncedFolderRemoteIdToId![file.remoteFolderId],
        })
        .select("id")
        .single();
      if (data) {
        // TODO mutate
        navigate(`/files/${data.id}`);
      } else {
        // snackbar
      }
    } else {
      navigate(`/files/${file.syncedFile.id}`);
    }
  };

  // load files from both google and supabase. Combine the results here. If
  // google is down, remain functional with an error message. If supabase is
  // down, abandon hope. Don't want to load the files from the backend because
  // that's slow and annoying if there's a queue; user should be able to jump or
  // reset the queue and prioritize new files from Drive. Biggest question is
  // how to paginate. Easier with infinite scroll. For now, load everything,
  // within limit for Drive so we don't get slammed.

  // combine supabase results with drive results
  const folderToFiles: FolderToFiles = pipe(
    concat(syncedFolderFiles, googleFolderFiles ?? []),
    groupBy((ff) => ff.remoteId ?? ""),
    (ffs) => Object.values(ffs),
    map((ffs) => mergeAll(ffs) as FolderFile),
    groupBy((x) => x.remoteFolderId)
  );

  // Loading indicator
  const isLoading =
    isLoadingGapi ||
    isLoadingAccessToken ||
    isLoadingSyncedFolders ||
    isLoadingGoogleFileFolders;
  // TODO timeout for loading

  //   errors
  const googleDriveNotLoading = !isLoading && googleFolderFiles === null;
  const noFoldersSynced = !isLoading && syncedFolders?.length === 0;

  console.log("folders", syncedFolders);
  console.log("synced", syncedFolderFiles);
  console.log("google", googleFolderFiles);
  console.log(folderToFiles);

  return (
    <>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h4">Google Drive Sync</Typography>
        <Button onClick={() => navigate("/settings/google-drive")}>
          <SettingsRoundedIcon sx={{ marginRight: 1 }} />
          Configure
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
            {!isLoading &&
              folderToFiles[folder.remote_id]?.map((file, j) => (
                <ListItem key={j}>
                  <Button
                    sx={{
                      display: "flex",
                      marginRight: "20px",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                    onClick={() => toFile(file)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
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
                        <CloudQueueRoundedIcon sx={{ marginRight: "5px" }} />
                      )}
                      {file.googleFile && (
                        <CheckRoundedIcon sx={{ marginRight: "3px" }} />
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

        {/* Google Drive is not loading */}
        {googleDriveNotLoading && (
          <ListItem>
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
