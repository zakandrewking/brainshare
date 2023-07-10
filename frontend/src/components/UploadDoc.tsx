import { get as _get, round as _round } from "lodash";
import { useContext, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { pdfjs } from "react-pdf/dist/esm/entry.webpack5";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { CircularProgress, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";

import { CrossrefWork, DefaultService } from "../client";
import {
  DocStep,
  DocStoreContext,
  docStoreInitialState,
} from "../stores/DocStore";
import { useAuth } from "../supabase";
import { formatBytes } from "../util/stringUtils";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

async function parseText(data: ArrayBuffer): Promise<string> {
  const doc = await pdfjs.getDocument(data).promise;
  const pages = doc._pdfInfo.numPages;
  let allText = "";
  for (let i = 1; i <= pages; i++) {
    const p = await doc.getPage(i);
    var textContent = await p.getTextContent();
    allText += textContent.items.map((s) => _get(s, ["str"], "")).join(" ");
  }
  return allText;
}

function StepIndicator({ step }: { step: DocStep | null }) {
  if (step === null) return null;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {step.ready ? (
        <CheckRoundedIcon />
      ) : step.error ? (
        <ErrorRoundedIcon />
      ) : (
        <CircularProgress />
      )}
      {<Box>{step.status}</Box>}
    </Stack>
  );
}

export default function UploadDoc() {
  const { session } = useAuth();
  const { state, dispatch } = useContext(DocStoreContext);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const navigate = useNavigate();

  // When we have a task_id, we poll for the status of the task
  useEffect(() => {
    const task_id = state.task_id;
    if (task_id) {
      const interval = setInterval(async () => {
        try {
          const res = await DefaultService.getRunAnnotateRunAnnotateTaskIdGet(
            task_id
          );
          if (res.error) {
            dispatch({
              task_id: null,
              annotateStep: {
                error: true,
                status: "Could not annotate. Try again later.",
              },
            });
            clearInterval(interval);
          } else if (res.annotations) {
            dispatch({
              task_id: null,
              annotateStep: {
                ready: true,
                status: res.annotations.crossref_work
                  ? "Done annotating"
                  : "Done annotations (with warnings)",
              },
              ...res.annotations,
            });
            clearInterval(interval);
          }
        } catch (e) {
          console.error(e);
          dispatch({
            task_id: null,
            annotateStep: {
              error: true,
              status: "Could not annotate. Try again later.",
            },
          });
          return;
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.task_id, dispatch]);

  const onDrop = async (acceptedFiles: File[]) => {
    dispatch({ uploadStatus: "Loading PDF..." });
    let file: File;
    try {
      [file] = acceptedFiles;
      dispatch({ fileName: file.name, fileSize: file.size });
    } catch {
      throw Error("Needs exactly one file"); // uploadStatus
    }
    const reader = new FileReader();
    reader.onloadstart = () => {
      dispatch({ parseStep: { status: "Reading document..." } });
    };

    reader.onload = async () => {
      const text = await parseText(reader.result as ArrayBuffer);
      dispatch({
        parseStep: { ready: true, status: "Done reading document" },
        annotateStep: { status: "Starting job" },
      });
      // annotate
      try {
        const { task_id } = await DefaultService.postRunAnnotateRunAnnotatePost(
          {
            text,
          }
        );
        dispatch({ task_id, annotateStep: { status: "Annotating" } });
      } catch (error) {
        console.error(error);
        dispatch({
          task_id: null,
          annotateStep: {
            error: true,
            status: "Could not annotate. Try again later.",
          },
        });
        return;
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: { "application/pdf ": [".pdf"] },
    });

  const dropzoneStatus =
    fileRejections.length !== 0
      ? "Could not read the file"
      : state.uploadStatus
      ? state.uploadStatus
      : isDragActive
      ? "Drop the files here ..."
      : "Drag a .pdf file here, or click to select a file";

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h4">Upload a PDF</Typography>
        {session ? (
          state.fileName === null ? (
            <Card
              variant="outlined"
              {...getRootProps()}
              sx={{
                cursor: "pointer",
                padding: "20px",
                marginTop: "30px",
                borderRadius: "3px",
                backgroundColor: prefersDarkMode
                  ? isDragActive
                    ? "hsl(290deg 15% 40%)"
                    : "hsl(290deg 15% 30%)"
                  : isDragActive
                  ? "hsl(280deg 37% 87%)"
                  : "hsl(280deg 56% 96%)",
                ":hover": {
                  backgroundColor: prefersDarkMode
                    ? "hsl(290deg 15% 40%)"
                    : "hsl(280deg 37% 87%)",
                },
                maxWidth: "400px",
              }}
            >
              <input {...getInputProps()} />
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    minHeight: "150px",
                    display: "flex",
                    alignItems: "center",
                    alignContent: "center",
                  }}
                >
                  <FileUploadRoundedIcon sx={{ margin: "10px" }} />
                  {dropzoneStatus}
                </Box>
              </Stack>
            </Card>
          ) : (
            <Card
              variant="outlined"
              sx={{
                padding: "18px 25px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginLeft: "-20px",
                marginBottom: "20px",
                maxWidth: "400px",
              }}
            >
              <CardHeader
                avatar={<PictureAsPdfRoundedIcon />}
                title={state.fileName}
                subheader={state.fileSize && formatBytes(state.fileSize)}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  dispatch(docStoreInitialState);
                }}
              >
                Start Over
              </Button>
              <StepIndicator step={state.parseStep} />
              <StepIndicator step={state.annotateStep} />
              <Button
                variant="outlined"
                disabled={!state.annotateStep?.ready}
                onClick={() => {
                  navigate("annotate");
                }}
              >
                See annotations
              </Button>
              <StepIndicator step={state.saveStep} />
              {state.tokens && (
                <Box>
                  Usage: {state.tokens.toLocaleString()} tokens, $
                  {_round((state.tokens * 0.002) / 1000, 3)}
                </Box>
              )}
            </Card>
          )
        ) : (
          <Box sx={{ marginTop: "30px" }}>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/log-in?redirect=/doc"
            >
              Log in to upload a file
            </Button>
          </Box>
        )}
      </Stack>
      <Typography paragraph={true} sx={{ marginTop: "50px" }}>
        Your PDF data is never shared with other users, and it is not saved on
        our server.
      </Typography>
    </Container>
  );
}
