import useMediaQuery from "@mui/material/useMediaQuery";
import { chunk as _chunk } from "lodash";

import Grid from "@mui/material/Grid";
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

export function Text({
  data,
  selectable = true,
}: {
  data: any;
  selectable?: boolean;
}) {
  return (
    <Typography
      sx={{ wordBreak: "break-all", ...(selectable && { userSelect: "all" }) }}
    >
      {data ? data.toString() : ""}
    </Typography>
  );
}

export function AminoAcidSequence({ data }: { data: string }) {
  return (
    <Grid container spacing={1} sx={{ display: "block", userSelect: "all" }}>
      {_chunk(data, 5).map((chunk) => (
        <Grid
          item
          component="span"
          sx={{ display: "inline-block", fontFamily: "monospace" }}
        >
          {chunk.join("")}
        </Grid>
      ))}
    </Grid>
  );
}
