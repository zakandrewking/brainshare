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
import { chunkSubstring } from "../util/stringUtils";

import { Document } from "react-pdf/dist/esm/entry.webpack5";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const d = Document;
// eslint-disable-next-line import/first
import { getDocument } from "pdfjs-dist";

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
      setStatus("Reading Document...");
      const doc = await getDocument(reader.result as ArrayBuffer).promise;
      setStatus("Parsing Text...");
      const pages = doc._pdfInfo.numPages;
      let allText = "";
      for (let i = 1; i <= pages; i++) {
        const p = await doc.getPage(i);
        var textContent = await p.getTextContent();
        allText += textContent.items.map((s) => _get(s, ["str"], "")).join(" ");
      }
      let resultText = "";
      let totalTokens = 0;
      setStatus("Getting chemicals");
      const chunks = chunkSubstring(allText, 3000);
      setText(allText);
      return;
      await Promise.all(
        chunks.map(async (t) => {
          const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: `The following text was extracted from a PDF document:

        ${t}

        List the chemical compounds that are mentioned in the article. If you
        find a chemical, provide the name of each chemical on a new line with
        a description, like (chemical Name: Description). If you do not find a
        chemical, say "No chemicals found".
        `,
              },
            ],
          });
          const newText = response.data.choices[0].message?.content ?? "";
          const newTokens = response.data.usage?.total_tokens ?? 0;
          resultText += newText;
          setText(resultText);
          totalTokens += newTokens;
          setTokens(totalTokens);
        })
      );
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

  return (
    <>
      {" "}
      <Typography variant="h4">Literature connector</Typography>
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
    </>
  );
}
