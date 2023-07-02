import { get as _get, round as _round } from "lodash";
import { useContext } from "react";
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

  const onDrop = async (acceptedFiles: File[]) => {
    dispatch({ uploadStatus: "Uploading PDF..." });
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
      let crossref_work: CrossrefWork | null = null;
      const text = await parseText(reader.result as ArrayBuffer);
      dispatch({
        parseStep: { ready: true, status: "Done reading document" },
        annotateStep: { status: "Annotating" },
      });
      // annotate
      try {
        const res = await DefaultService.postAnnotateAnnotatePost({ text });
        if (res.crossref_work) {
          crossref_work = res.crossref_work;
          dispatch({
            annotateStep: { ready: true, status: "Done annotating" },
            ...res,
          });
        } else {
          dispatch({
            annotateStep: {
              ready: true,
              status: "Done annotating (with warnings)",
            },
            saveStep: {
              error: true,
              status: "Cannot save with warnings",
            },
            ...res,
          });
          return;
        }
      } catch (error) {
        console.error(error);
        dispatch({
          annotateStep: {
            error: true,
            status: "Could not annotate. Try again later.",
          },
        });
        return;
      }

      if (crossref_work === null) throw Error("Missing crossref_work");

      // save
      // dispatch({ saveStep: { status: "Saving the article" } });
      // try {
      //   const res = await DefaultService.postArticleArticlePost({
      //     text,
      //     crossref_work,
      //     user_id: session!.user.id,
      //   });
      //   dispatch({
      //     saveStep: { ready: true, status: "Saved" },
      //     ...res,
      //   });
      // } catch (error) {
      //   console.error(error);
      //   dispatch({
      //     saveStep: {
      //       error: true,
      //       // TODO handle duplicate doi
      //       status: "Could not save. Try again later.",
      //     },
      //   });
      // }
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
