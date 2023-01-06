import useMediaQuery from "@mui/material/useMediaQuery";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useStructureUrl } from "../supabaseClient";

export function Svg({
  object,
  bucket,
  pathTemplate,
  height,
}: {
  object: any;
  bucket: string;
  pathTemplate: string;
  height: number;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    object,
    bucket,
    pathTemplate,
    prefersDarkMode
  );
  return (
    <Box
      sx={{
        height: `${height}px`,
        overflow: "hidden",
      }}
    >
      {svgUrl && (
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          alt="structure"
          src={svgUrl}
        />
      )}
    </Box>
  );
}

export function Text({ data }: { data: any }) {
  return (
    <Typography sx={{ wordBreak: "break-all" }}>
      {data ? data.toString() : ""}
    </Typography>
  );
}
