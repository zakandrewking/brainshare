import useMediaQuery from "@mui/material/useMediaQuery";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useStructureUrl } from "../supabaseClient";
import { Fragment } from "react";

export function Svg({
  object,
  bucket,
  pathTemplate,
  height,
  maxWidth,
}: {
  object: any;
  bucket: string;
  pathTemplate: string;
  height: number;
  maxWidth?: number;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    object,
    bucket,
    pathTemplate,
    prefersDarkMode
  );
  return (
    <Fragment>
      {svgUrl && (
        <img
          style={{
            height: `${height}px`,
            ...(maxWidth && {
              maxWidth: `${maxWidth}px`,
            }),
          }}
          alt="structure"
          src={svgUrl}
        />
      )}
    </Fragment>
  );
}

export function Text({ data }: { data: any }) {
  return (
    <Typography sx={{ wordBreak: "break-all", userSelect: "all" }}>
      {data ? data.toString() : ""}
    </Typography>
  );
}
