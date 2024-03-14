/**
 * Design Spec: Use this for
 * - loading a single item
 * - dialog box with a text entry field & validation & accept on enter
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  TextField,
  Typography,
} from "@mui/material";

// Need another md editor with a smaller bundle size
// import MDEditor from "@uiw/react-md-editor";

import { DefaultService } from "../client";
import useErrorBar from "../hooks/useErrorBar";
import useGoogleDrive from "../hooks/useGoogleDrive";
import supabase, { useAuth } from "../supabase";
import PdfView from "./fileViews/PdfView";
import TextView from "./fileViews/TextView";
import TsvView, { parseTsv } from "./fileViews/TsvView";
import GraphCorner from "./GraphCorner";
import { Bold } from "./textComponents";
import useDebounce from "../hooks/useDebounce";
import LoadingFade from "./shared/LoadingFade";
import { set } from "lodash";

// ---------
// Component
// ---------

/**
 * Display a file or folder synced with Google Drive
 */
export default function File() {
  // -----
  // Hooks
  // -----

  const { id } = useParams();
  const google = useGoogleDrive();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [hasGraph, setHasGraph] = useState(true);
  const { showError } = useErrorBar();

  // -------------
  // Session check
  // -------------

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    if (!session) navigate(`/log-in?redirect=/file/${id}`);
  }, [session, navigate, id]);

  // ------------
  // Data loading
  // ------------

  const {
    data: file,
    error: fileError,
    mutate: fileMutate,
    isLoading: fileIsLoading,
  } = useSWR(
    `/file/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("synced_file")
        .select("*, file_data(text_summary), dataset_metadata(id, table_name)")
        .eq("id", id!)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      // Revalidate on mount (i.e. if stale) for data that can change without
      // user input
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const previewIsSupported = file?.mime_type
    ? isSupported(file.mime_type).supported
    : false;

  const readyToDownload = file?.remote_id && previewIsSupported && google.gapi;

  const { data: content, isLoading: contentIsLoading } = useSWR(
    readyToDownload ? `/file/${id}/content` : null,
    async () => {
      // download the file
      try {
        const res = await google.gapi.client.drive.files.get({
          fileId: file?.remote_id!,
          alt: "media",
        });
        return res.body as string;
      } catch (error) {
        return null;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // ----------------
  // Realtime updates
  // ----------------

  // TODO use a task_link channel instead
  // // watch for status changes
  // useEffect(() => {
  //   if (!file) return;
  //   const syncedFileChannel = supabase
  //     .channel("synced-file-changes")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "synced_file",
  //         filter: `id=eq.${file.id}`,
  //       },
  //       (payload) => {
  //         const newFile = payload.new as SyncedFileType;
  //         fileMutate(
  //           {
  //             ...file,
  //             ...newFile,
  //           },
  //           false
  //         );
  //       }
  //     )
  //     .subscribe();
  //   const fileDataChannel = supabase
  //     .channel("file-data-changes")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "file_data",
  //         filter: `synced_file_id=eq.${file.id}`,
  //       },
  //       (payload) => {
  //         const newData = payload.new as FileDataType;
  //         const updatedFile = {
  //           ...file,
  //           file_data: [
  //             {
  //               text_summary: newData.text_summary,
  //             },
  //           ],
  //         };
  //         fileMutate(updatedFile, false);
  //       }
  //     )
  //     .subscribe();
  //   return () => {
  //     syncedFileChannel.unsubscribe();
  //     fileDataChannel.unsubscribe();
  //   };
  // }, [file, fileMutate]);

  // ------------------
  // Computed variables
  // ------------------

  const isLoading = fileIsLoading || contentIsLoading || google.isLoading;

  // Can include some hooks (e.g. useMemo), but not data loading

  const summary = file?.file_data[0] && file?.file_data[0].text_summary;

  const [tsvColumns, tsvRows] = useMemo(() => {
    if (
      content === undefined ||
      content === null ||
      file?.mime_type !== "text/tab-separated-values"
    )
      return [null, null];
    return parseTsv(content);
  }, [content, file]);

  // --------
  // Handlers
  // --------

  const handleCreateDataset = async (datasetName: string) => {
    const dataset_metadata_id = await DefaultService.postCreateDataset({
      dataset_name: datasetName,
      synced_file_id: file!.id,
    });
    fileMutate(
      {
        ...file!,
        dataset_metadata: [
          ...file!.dataset_metadata,
          {
            id: dataset_metadata_id,
            table_name: datasetName,
          },
        ],
      },
      { revalidate: false }
    );
  };

  // ---------------
  // Redirect checks
  // ---------------

  // if this is a folder, then navigate to the folder page
  useEffect(() => {
    if (file?.is_folder) {
      navigate(`/file/folder/${file.id}`);
    }
  }, [file, navigate]);

  // ------
  // Render
  // ------

  // TODO top level components should render a succinct set of components
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        gap: 2,
        my: 3,
      }}
    >
      <Box sx={{ marginBottom: "10px" }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/files">
            Files
          </Link>
          <Bold>{file?.name}</Bold>
        </Breadcrumbs>
      </Box>

      {/* Dataset connection */}
      <Bold>Dataset</Bold>
      {(file?.dataset_metadata?.length || 0) > 0 ? (
        <Box>
          {file?.dataset_metadata.map((d) => (
            <Button
              key={d.id}
              component={RouterLink}
              to={`/dataset/${d.id}`}
              variant="contained"
            >
              {d.table_name}
            </Button>
          ))}
        </Box>
      ) : (
        <DatasetDialog
          handleCreateDataset={handleCreateDataset}
          disabled={file?.mime_type !== "text/tab-separated-values" || !content}
        />
      )}

      {/* <Stack direction="row" sx={{ alignItems: "center", gap: 3 }}>
        <Box>
           TODO middleware to enumify this?
          Status:{" "}
          {file?.processing_status === "processing"
            ? "Processing"
            : file?.processing_status === "done"
            ? "Done"
            : file?.processing_status === "error"
            ? "Error"
            : file?.processing_status === "not_started"
            ? "Not Started"
            : ""}
        </Box>
        <Box>
           <Button
            onClick={startProcessing}
            disabled={!(file?.processing_status === "processing")}
          >
            Stop Processing
          </Button>
          <Button
            onClick={startProcessing}
            disabled={!(file?.processing_status === "not_started")}
          >
            Start Processing
          </Button>
           <Button
            onClick={startProcessing}
            // disabled={
            //   !(
            //     file?.processing_status === "done" ||
            //     file?.processing_status === "error"
            //   )
            // }
          >
            Retry Processing
          </Button>
        </Box>
      </Stack> */}

      {/* summary box */}
      {summary && (
        <Box>
          <Bold>Summary</Bold>
          <Box
            sx={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            {summary}
          </Box>
        </Box>
      )}

      {/* Preview */}
      <Bold>Preview</Bold>
      {content && filePreview(file?.mime_type!, content, tsvColumns, tsvRows)}
      {!previewIsSupported && <>Cannot preview this file type yet</>}

      {/* Spinners */}
      <LoadingFade isLoading={isLoading} center />

      {/* Error */}
      {fileError && <>Could not load file</>}

      {/* Graph */}
      {hasGraph && <GraphCorner />}
    </Container>
  );
}

// ---------------
// More components
// ---------------

interface MimeTypeSupport {
  mimeType: string;
  supported: boolean;
  partial: boolean;
}

function isSupported(mimeType: string): MimeTypeSupport {
  const supportedMimeTypes = [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "text/tab-separated-values",
  ];
  const supportedPartial = [
    "text/plain",
    "text/markdown",
    "text/tab-separated-values",
  ];
  return {
    mimeType,
    supported: supportedMimeTypes.indexOf(mimeType) > -1,
    partial: supportedPartial.indexOf(mimeType) > -1,
  };
}

function filePreview(
  mimeType: string,
  content: string,
  tsvColumns: { field: string }[] | null,
  tsvRows: Record<string, string>[] | null
) {
  if (mimeType === "text/plain") {
    return <TextView text={content} />;
  } else if (mimeType === "text/markdown") {
    return <FileViewMarkdown source={content} />;
  } else if (mimeType === "application/pdf") {
    return <PdfView binaryString={content} />;
  } else if (mimeType === "text/tab-separated-values") {
    return <TsvView rows={tsvRows!} columns={tsvColumns!} />;
  }
  return <></>;
}

function FileViewMarkdown({ source }: { source: string }) {
  return (
    <></>
    // <MDEditor.Markdown
    //   source={source}
    //   rehypeRewrite={(node) => {
    //     if (node.type === "element" && node.tagName === "a") {
    //       node.properties = { ...node.properties, target: "_blank" };
    //     }
    //   }}
    //   style={{
    //     marginLeft: "15px",
    //     background: "none",
    //     whiteSpace: "pre-wrap",
    //     border: "1px solid #ccc",
    //     borderRadius: "4px",
    //     padding: "10px",
    //   }}
    // />
  );
}

function DatasetDialog({
  handleCreateDataset,
  disabled,
}: {
  handleCreateDataset: (datasetName: string) => Promise<void>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  const [datasetName, setDatasetName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { showError } = useErrorBar();

  // null = valid; undefined = not checked; string = invalid
  const [validateMessage, setValidateMessage] = useState<
    string | null | undefined
  >(undefined);

  const validateExternal = useCallback(
    async (name: string) => {
      // TODO filter by project
      const { data, error } = await supabase
        .from("dataset_metadata")
        .select("id")
        .eq("table_name", name)
        .limit(1);

      setIsValidating(false);

      if (error) {
        showError();
        throw error;
      }
      const isValid = data?.length === 0;
      setValidateMessage(isValid ? null : "Name is already in use.");
    },
    [showError]
  );

  const debouncedValidate = useDebounce(validateExternal);

  const handleValidate = async (newDatasetName: string) => {
    // TODO move cheap checks out of the debounced function
    const minLength = 3;

    if (newDatasetName.length < minLength) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage((m) =>
        m === undefined ? undefined : "Name must be at least 3 characters."
      );
      return;
    }

    // check alphanumeric and lowercase
    const alphanumericLowercaseRegex = /^[a-z0-9]+$/;
    if (!alphanumericLowercaseRegex.test(newDatasetName)) {
      setIsValidating(false);
      debouncedValidate.cancel();
      setValidateMessage("Name must be alphanumeric and lowercase.");
      return;
    }

    setIsValidating(true);
    await debouncedValidate.call(newDatasetName);
  };

  return (
    <Box>
      <Button
        variant="contained"
        onClick={async () => {
          setOpen(true);
          handleValidate(datasetName);
        }}
        disabled={disabled}
      >
        Create Dataset
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setValidateMessage(undefined);
        }}
        // https://github.com/mui/material-ui/issues/33004#issuecomment-1455260156
        disableRestoreFocus
        // for enter to submit, I'm getting an error turning this into a form.
        // do it later
        // PaperProps={{
        //   ...PaperProps,
        //   component: "form",
        //   onSubmit: async (event) => { ...
      >
        <DialogTitle>Create new dataset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the name for the new dataset.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Dataset Name"
            type="text"
            fullWidth
            value={datasetName}
            onChange={async (event) => {
              const newDatasetName = event.target.value;
              setDatasetName(newDatasetName);
              await handleValidate(newDatasetName);
            }}
            sx={{ mt: 2 }}
          />
          <Typography
            variant="caption"
            sx={{ pt: "10px", minHeight: "40px", display: "block" }}
          >
            {isValidating
              ? "Checking..."
              : validateMessage === undefined
              ? " "
              : validateMessage === null
              ? "OK!"
              : validateMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          {isCreatingDataset && <CircularProgress size={20} sx={{ mr: 2 }} />}
          <Button
            onClick={() => {
              setOpen(false);
              setValidateMessage(undefined);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              debouncedValidate.cancel();
              setIsCreatingDataset(true);
              try {
                await handleCreateDataset(datasetName);
              } catch (error) {
                setIsCreatingDataset(false);
                showError();
                throw error;
              }
              setIsCreatingDataset(false);
              setOpen(false);
            }}
            disabled={
              isValidating || validateMessage !== null || isCreatingDataset
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
