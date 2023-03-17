import { get as _get, round as _round } from "lodash";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link as RouterLink } from "react-router-dom";
import { Configuration, OpenAIApi } from "openai";

import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useAuth } from "../supabase";
// import { chunkSubstring } from "../util/stringUtils";
import { DefaultService, Document } from "../client";

import { Document as D } from "react-pdf/dist/esm/entry.webpack5";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const d = D;
// eslint-disable-next-line import/first
import { getDocument } from "pdfjs-dist";

async function parseText(data: ArrayBuffer): Promise<string> {
  const doc = await getDocument(data).promise;
  const pages = doc._pdfInfo.numPages;
  let allText = "";
  for (let i = 1; i <= pages; i++) {
    const p = await doc.getPage(i);
    var textContent = await p.getTextContent();
    allText += textContent.items.map((s) => _get(s, ["str"], "")).join(" ");
  }
  return allText;
}

const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function MyDropzone() {
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
  const [tokens, setTokens] = useState(0);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const onDrop = async (acceptedFiles: File[]) => {
    setStatus("Uploading PDF...");
    let file: File;
    try {
      [file] = acceptedFiles;
    } catch {
      throw Error("Needs exactly one file");
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setStatus("Reading document...");
      const allText = await parseText(reader.result as ArrayBuffer);
      setStatus("Parsing document...");
      setText(allText);
      // setLoading(true);
      try {
        await DefaultService.documentDocumentPost({
          name: file.name,
          text: allText,
        });
      } catch (error) {
        setStatus(`Error: ${error}`);
      }
      setStatus("Done");
    };
    reader.readAsArrayBuffer(file);
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "application/pdf ": [".pdf"] },
  });

  const acceptedFileItems = acceptedFiles.map((file) => (
    <div key={file.name}>File: {file.name}</div>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.name}>Cloud not upload: {file.name}</div>
  ));

  return (
    <>
      <Box
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
        }}
      >
        <input {...getInputProps()} />
        <Stack spacing={2} alignItems="center">
          <Box textAlign="center">
            {isDragActive
              ? "Drop the files here ...                         "
              : "Drag a .pdf file here, or click to select a file"}
          </Box>
          {acceptedFileItems}
          {fileRejectionItems}
          {status !== "" && <Box>Status: {status}</Box>}
          {tokens !== 0 &&
            `Total tokens used: ${tokens}; cost: $${_round(
              (tokens * 0.002) / 1000,
              3
            )}`}
        </Stack>
      </Box>
      <Box sx={{ whiteSpace: "pre-line" }}>{text}</Box>
    </>
  );
}

export default function UploadDoc() {
  const { session } = useAuth();

  // const [result, setResult] = useState("");
  // const [loading, setLoading] = useState(false);

  return (
    <Stack spacing={4}>
      <Typography variant="h4">Literature connector</Typography>
      {/* <Button
        disabled={loading}
        variant="outlined"
        onClick={async () => {
          setLoading(true);
          const res = await DefaultService.postQueryPost({ query: "hi!" });
          setResult(res ?? "");
          setLoading(false);
        }}
      >
        Query
      </Button> */}
      {/* <Typography>Result: {result}</Typography> */}
      {session ? (
        <MyDropzone></MyDropzone>
      ) : (
        <Box sx={{ marginTop: "30px" }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/log-in?redirect=/upload-doc"
          >
            Log in to upload a file
          </Button>
        </Box>
      )}
    </Stack>
  );
}
