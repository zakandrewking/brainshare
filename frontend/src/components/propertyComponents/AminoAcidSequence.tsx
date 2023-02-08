import { chunk as _chunk, get as _get } from "lodash";

import Grid from "@mui/material/Grid";
export default function AminoAcidSequence({
  data,
  propertyKey,
}: {
  data: any;
  propertyKey: string;
}) {
  const sequence = _get(data, [propertyKey], "");
  return (
    <Grid
      container
      spacing={1}
      sx={{
        display: "block",
      }}
    >
      {_chunk(sequence, 5).map((chunk, i) => (
        <Grid
          item
          component="span"
          key={i}
          sx={{ display: "inline-block", fontFamily: "monospace" }}
        >
          {chunk.join("")}
        </Grid>
      ))}
    </Grid>
  );
}
