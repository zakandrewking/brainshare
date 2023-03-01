import { get as _get } from "lodash";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Document } from "react-pdf/dist/esm/entry.webpack5";
import { Link as RouterLink } from "react-router-dom";
import { Configuration, OpenAIApi } from "openai";

import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useAuth } from "../supabase";

console.log(Document);
// eslint-disable-next-line import/first
import { getDocument } from "pdfjs-dist";

const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function MyDropzone() {
  const [status, setStatus] = useState("");
  const [text, setText] = useState("");
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
        allText += textContent.items.map((s) => _get(s, ["str"], "")).join("");
      }
      console.log(allText);
      setText(allText.slice(0, 3000));
      setStatus("Getting title");
      return;
      throw Error("saving money");
      const completion = await openai.createCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: 2000,
        prompt: `
        Here is a messy excerpt from a PDF extract of a research paper:

        ${allText.slice(0, 1000)}

        The title of the paper (providing only the title) is:
        `,
        // The full list of the authors of the paper is (ignoring the numbers
        // that indicate citations next to the names) in the format Last Name,
        // First Name Initials: (requires more than the default number of tokens)
      });
      console.log(completion.data.choices);
      setText(completion.data.choices[0].text ?? "");
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
    <div key={file.name}>accepted: {file.name}</div>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <div key={file.name}>rejected: {file.name}</div>
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
          {status !== "" && <Box>Status: {status}</Box>}
          {acceptedFileItems}
          {fileRejectionItems}
        </Stack>
      </Box>
      {text}
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
        <Box>
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
