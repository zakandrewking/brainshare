import "react-pdf/dist/cjs/Page/TextLayer.css";
import "react-pdf/dist/cjs/Page/AnnotationLayer.css";

import { memo, useEffect, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import ArrowCircleLeftRoundedIcon from "@mui/icons-material/ArrowCircleLeftRounded";
import ArrowCircleRightRoundedIcon from "@mui/icons-material/ArrowCircleRightRounded";
import { Box, IconButton } from "@mui/material";

import {
  ContextMenu,
  useSelectionContextMenu,
} from "../../hooks/useSelectionContextMenu";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export default function PdfView({ binaryString }: { binaryString: string }) {
  const data = useMemo(() => {
    return Uint8Array.from(binaryString, (m) => m.charCodeAt(0));
  }, [binaryString]);
  const [width, setWidth] = useState(0);
  const {
    isOpen,
    parentRef,
    referenceRef,
    floatingRef,
    floatingStyles,
    referenceProps,
    floatingProps,
  } = useSelectionContextMenu();

  useEffect(() => {
    if (parentRef.current && width === 0) {
      setWidth(parentRef.current.offsetWidth - 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentRef]);

  // TODO nav pages
  // https://github.com/wojtekmaj/react-pdf/issues/607
  return (
    <>
      <Box ref={parentRef}>
        <Box
          ref={referenceRef}
          {...referenceProps}
          sx={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "4px",
            display: "inline-block",
          }}
        >
          <PdfDocument data={data} width={width} />
        </Box>
      </Box>
      {isOpen && (
        <ContextMenu
          floatingRef={floatingRef}
          floatingProps={floatingProps}
          floatingStyles={floatingStyles}
        />
      )}
    </>
  );
}

const PdfDocument = memo(function PdfDocument({
  data,
  width,
}: {
  data: Uint8Array;
  width: number;
}) {
  // https://github.com/wojtekmaj/react-pdf/issues/1657
  const copyArrayBuffer = (arrayBuffer: ArrayBuffer) => {
    const copiedArrayBuffer = new ArrayBuffer(arrayBuffer.byteLength);
    new Uint8Array(copiedArrayBuffer).set(new Uint8Array(arrayBuffer));
    return copiedArrayBuffer;
  };

  const [height, setHeight] = useState(0);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  if (width === 0) return <></>;
  return (
    <Box
      height={height ? `${height}px` : "unset"}
      width={width ? `${width}px` : "unset"}
      sx={{
        position: "relative",
        background: "white",
      }}
    >
      <Document
        file={{ data: copyArrayBuffer(data) }}
        externalLinkTarget="_blank"
        onItemClick={({ pageNumber }) => {
          setPage(pageNumber);
        }}
        onLoadSuccess={async (pdf) => {
          setNumPages(pdf.numPages);
          const p = await pdf.getPage(page);
          if (width > 0) {
            setHeight((p.view[3] / p.view[2]) * width);
          }
        }}
      >
        <Page pageNumber={page} width={width} />
      </Document>
      <Box
        id="page-selector"
        sx={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translate(-50%)",
          background: "white",
          opacity: 0.2,
          transition: "opacity ease-in-out 0.2s",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderRadius: "10px",
          userSelect: "none",
          zIndex: 100,
          "&:hover": {
            opacity: "1.0 !important",
          },
        }}
      >
        <IconButton
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => {
            setPage(page - 1);
          }}
          sx={{
            "&:hover": { opacity: 0.8 },
            "&.Mui-disabled": { opacity: "0.5 !important" },
          }}
        >
          <ArrowCircleLeftRoundedIcon
            fontSize="large"
            sx={{
              color: "black",
            }}
          />
        </IconButton>

        <Box sx={{ color: "black", textAlign: "center" }}>
          {page} of {numPages}
        </Box>
        <IconButton
          disabled={page >= numPages}
          onClick={() => {
            setPage(page + 1);
          }}
          aria-label="Next page"
          sx={{
            "&:hover": { opacity: 0.7 },
            "&.Mui-disabled": { opacity: "0.4 !important" },
          }}
        >
          <ArrowCircleRightRoundedIcon
            fontSize="large"
            sx={{
              color: "black",
            }}
          />
        </IconButton>
      </Box>
    </Box>
  );
});
