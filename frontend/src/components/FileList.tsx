/**
 * Design Spec: Use this for
 * - loading a list of items
 * - realtime updating of items via tasks
 * - session check
 */

import { Fragment } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import * as R from "remeda";
import useSWR from "swr";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Link,
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
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
import LoadingFade from "./shared/LoadingFade";
import TaskStatusButton from "./shared/TaskStatusButton";
import useProjectLookup from "../hooks/useProjectLookup";

type SyncedFile = Database["public"]["Tables"]["synced_file"]["Row"];
type TaskLinkType = Database["public"]["Tables"]["task_link"]["Row"];

const ListItemIconInline = styled(ListItemIcon)(() => ({
  minWidth: "35px",
}));

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

export default function FileList() {
  // -----
  // Hooks
  // -----

  const { session } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const google = useGoogleDrive();

  // if ID is undefined, then this is the top level
  const { id } = useParams();
  const syncedFileFolderId = id ? Number(id) : undefined;

  // ------------
  // Data loading
  // ------------

  const { keyForProject, joinsForProject, filterForProject } =
    useProjectLookup();

  // load the synced folders
  // - TODO these are not auto-updating during the first sync
  // - TODO breadcrumbs should have at least the parent folder for files
  const { data: syncedFolders, isLoading: isLoadingSyncedFolders } = useSWR(
    keyForProject(
      (proj) =>
        `/projectKey/${proj}/synced_folder?source=google_drive&join=synced_file` +
        (syncedFileFolderId ? `&parent_folder_id=${syncedFileFolderId}` : "")
    ),
    async () => {
      if (syncedFileFolderId) {
        // we want to get info on the current folder and its children
        const { data, error } = await filterForProject(
          supabase
            .from("synced_folder")
            // for the nested case, we only want the current synced folder, so we
            // use !inner
            .select(joinsForProject("*, synced_file!inner(*)"))
            .filter("source", "eq", "google_drive")
            .filter("synced_file.deleted", "eq", false)
            .or(
              `id.eq.${syncedFileFolderId}, parent_ids.cs.{${syncedFileFolderId}}`,
              { foreignTable: "synced_file" }
            )
        ).returns<SyncedFolderWithFiles[]>();
        if (error) {
          console.error(error);
          throw Error("Could not fetch synced folders");
        }
        return data;
      } else {
        // -1 indicates root
        const { data, error } = await filterForProject(
          supabase
            .from("synced_folder")
            .select(joinsForProject("*, synced_file(*)"))
            .filter("source", "eq", "google_drive")
            .filter("synced_file.deleted", "eq", false)
            .contains("synced_file.parent_ids", [-1])
        ).returns<SyncedFolderWithFiles[]>();
        if (error) {
          console.error(error);
          throw Error("Could not fetch synced folders");
        }
        return data;
      }
    },
    {
      // will also update and/or revalidate with realtime
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

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
    syncedFolders !== undefined && syncedFolders.length === 0;

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page

  if (session === null) {
    return (
      <Container>
        <Typography variant="h4">Files</Typography>
        <Button
          sx={{ marginTop: "30px" }}
          variant="outlined"
          component={RouterLink}
          to={`/log-in?redirect=${pathname}`}
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
              <Button
                component={RouterLink}
                to={`../file/${syncedFileFolderId}`}
              >
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

  return (
    <Container>
      <Stack spacing={4}>
        <Stack direction="row" spacing={4} alignItems="center">
          <Typography variant="h4">Files</Typography>
          {!noFoldersSynced && (
            <Button onClick={() => navigate(`sync/google-drive`)}>
              <SettingsRoundedIcon sx={{ mr: 1 }} />
              Configure Google Drive
            </Button>
          )}
        </Stack>

        {noFoldersSynced && <FirstSyncOptions />}

        {!noFoldersSynced && (
          <Stack direction="column" spacing={2} alignItems="start">
            {/* No folders synced */}
            {noFoldersSynced && (
              <Typography>No folders are synced. </Typography>
            )}

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
                          <ListItemIconInline>
                            <FolderSpecialRoundedIcon />
                          </ListItemIconInline>
                          <Link
                            component={RouterLink}
                            to={"TODO"}
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
                          <ListItemIconInline>
                            <FolderOpenRoundedIcon />
                          </ListItemIconInline>
                          {syncedFileFolder?.syncedFile.name}
                        </Stack>
                      </Stack>
                    ) : (
                      <>
                        <ListItemIconInline>
                          <FolderSpecialRoundedIcon />
                        </ListItemIconInline>
                        {folder.name}
                      </>
                    )}
                    <TaskStatusButton
                      taskLinkRefTable={"synced_folder"}
                      taskLinkRefColumn={"sync_folder_task_link_id"}
                      taskLinkRefId={folder.id}
                      taskType="sync_folder"
                      handleCreateTask={(clean_up_only: boolean = false) =>
                        DefaultService.postTaskSyncFolder({
                          synced_folder_id: folder.id,
                          synced_file_folder_id: syncedFileFolderId,
                          clean_up_only,
                        })
                      }
                    />
                  </Stack>
                  {!isLoading &&
                    !(folderToFiles[folder.remote_id]?.length > 0) && (
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
                              ? `../file/folder/${file.syncedFile.id}`
                              : `../file/${file.syncedFile.id}`
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
                                <FolderOpenRoundedIcon />
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
                    to={`../sync/google-drive`}
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
          </Stack>
        )}

        {/* Spinner */}
        <LoadingFade isLoading={isLoading} />
      </Stack>
    </Container>
  );
}

// ---------------
// More components
// ---------------

function FirstSyncOptions() {
  const navigate = useNavigate();

  // <Grid spacing={2}>
  return (
    <>
      <Typography variant="h6" sx={{ fontStyle: "italic" }}>
        Set up your new project by syncing files:
      </Typography>
      <Card variant="outlined" sx={{ maxWidth: 230 }}>
        <CardActionArea
          onClick={() => {
            navigate(`../sync/google-drive`);
          }}
        >
          <CardMedia
            component="img"
            src={`${process.env.PUBLIC_URL}/google-drive-logo.png`}
            alt="google-drive"
            sx={{ px: 4, pt: 4, pb: 1 }}
          />
          <CardContent>
            {/* TODO use gutterBottom more often */}
            <Typography gutterBottom variant="h6">
              Sync Google Drive
            </Typography>
            <Typography variant="body2">
              Sync files from Google Drive to this project.
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </>
  );
}
