/**
 * Design Spec: Use this for loading a single item
 */

import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Fade,
  Link,
} from "@mui/material";
import MDEditor from "@uiw/react-md-editor";

import { DefaultService } from "../client";
import { Database } from "../database.types";
import { useAsyncEffect } from "../hooks/useAsyncEffect";
import useGoogleDrive from "../hooks/useGoogleDrive";
import useStateWithLoading from "../hooks/useStateWithLoading";
import supabase, { useAuth } from "../supabase";
import PdfView from "./fileViews/PdfView";
import TextView from "./fileViews/TextView";
import TsvView from "./fileViews/TsvView";
import GraphCorner from "./GraphCorner";
import { Bold } from "./textComponents";

const MAX_PREVIEW_BYTES = 100000;

type SyncedFileType = Database["public"]["Tables"]["synced_file"]["Row"];
type FileDataType = Database["public"]["Tables"]["file_data"]["Row"];

// can drop after https://github.com/supabase/cli/issues/736
type SyncedFileWithDataSummary = SyncedFileType & {
  file_data: { text_summary: string | null }[];
} & {
  dataset_metadata: { id: number; dataset_table_name: string }[];
};

export default function SyncedFile() {
  const { id } = useParams();
  const google = useGoogleDrive();
  const [content, setContent, isLoadingPreview] = useStateWithLoading<string>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [hasGraph, setHasGraph] = useState(true);

  // Navigable pages should have a Log In button; linkable pages should redirect
  // to log in with a redirect back to the page
  useEffect(() => {
    if (!session) navigate(`/log-in?redirect=/files/${id}`);
  }, [session, navigate, id]);

  const {
    data: file,
    error: fileError,
    isValidating,
    mutate: mutateFile,
  } = useSWR(
    `/files/${id}`,
    async () => {
      const { data, error } = await supabase
        .from("synced_file")
        .select(
          "*, file_data(text_summary), dataset_metadata(id, dataset_table_name)"
        )
        .eq("id", id)
        .returns<SyncedFileWithDataSummary>()
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useAsyncEffect(
    async () => {
      if (!google.gapi || file === undefined) {
        return;
      }
      if (!isSupported(file.mime_type).supported) {
        setContent(null);
        return;
      }
      // download the file
      try {
        const res = await google.gapi.client.drive.files.get({
          fileId: file.remote_id,
          alt: "media",
        });
        setContent(res.body);
      } catch (error) {
        setContent(null);
      }
    },
    async () => {},
    [file, google.gapi]
  );

  // Actions
  const startProcessing = async () => {
    DefaultService.postRunUpdateSyncedFile(file!.id);
  };

  // watch for status changes
  useEffect(() => {
    if (!file) return;
    const syncedFileChannel = supabase
      .channel("synced-file-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "synced_file",
          filter: `id=eq.${file.id}`,
        },
        (payload) => {
          const newFile = payload.new as SyncedFileType;
          mutateFile(
            {
              ...file,
              ...newFile,
            },
            false
          );
        }
      )
      .subscribe();
    const fileDataChannel = supabase
      .channel("file-data-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "file_data",
          filter: `synced_file_id=eq.${file.id}`,
        },
        (payload) => {
          const newData = payload.new as FileDataType;
          const updatedFile = {
            ...file,
            file_data: [
              {
                text_summary: newData.text_summary,
              },
            ],
          };
          mutateFile(updatedFile, false);
        }
      )
      .subscribe();
    return () => {
      syncedFileChannel.unsubscribe();
      fileDataChannel.unsubscribe();
    };
  }, [file, mutateFile]);

  // if this is a folder, then navigate to the folder page
  useEffect(() => {
    if (file?.is_folder) {
      navigate(`/files/folder/${file.id}`);
    }
  }, [file, navigate]);

  const summary = file?.file_data[0] && file?.file_data[0].text_summary;

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        m: 3,
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
              {d.dataset_table_name}
            </Button>
          ))}
        </Box>
      ) : (
        <Box>
          <Button
            variant="contained"
            onClick={async () => {
              await DefaultService.postCreateDataset({
                table_name: file?.name || "",
                column_names: [],
                column_data_types: [],
                synced_file_id: file!.id,
              });
            }}
          >
            Create Dataset
          </Button>
        </Box>
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
      {file !== undefined &&
        content &&
        content !== "" &&
        filePreview(file.mime_type, content)}
      {/* Error */}
      {!isLoadingPreview &&
        content === null &&
        (isSupported(file?.mime_type || "").supported ? (
          <>Could not load file</>
        ) : (
          <>Cannot preview this file type yet</>
        ))}
      {/* Loading */}
      <Fade
        in={isLoadingPreview}
        style={{
          transitionDelay: isLoadingPreview ? "800ms" : "0ms",
        }}
        unmountOnExit
      >
        <CircularProgress />
      </Fade>

      {/* Loading */}
      {isValidating && (
        <Box display="flex" justifyContent="center">
          <Fade
            in={isValidating}
            style={{
              transitionDelay: isValidating ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        </Box>
      )}

      {/* Error */}
      {fileError && <>Could not load file</>}

      {/* Graph */}
      {hasGraph && <GraphCorner />}
    </Box>
  );
}

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

function filePreview(mimeType: string, content: string) {
  if (mimeType === "text/plain") {
    return <TextView text={content} />;
  } else if (mimeType === "text/markdown") {
    return <FileViewMarkdown source={content} />;
  } else if (mimeType === "application/pdf") {
    return <PdfView binaryString={content} />;
  } else if (mimeType === "text/tab-separated-values") {
    return <TsvView source={content} uniqueId={"fileSyncedTsvPreview"} />;
  }
  return <></>;
}

function FileViewMarkdown({ source }: { source: string }) {
  return (
    <MDEditor.Markdown
      source={source}
      rehypeRewrite={(node) => {
        if (node.type === "element" && node.tagName === "a") {
          node.properties = { ...node.properties, target: "_blank" };
        }
      }}
      style={{
        marginLeft: "15px",
        background: "none",
        whiteSpace: "pre-wrap",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "10px",
      }}
    />
  );
}
