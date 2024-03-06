import Typography from "@mui/material/Typography";

import { DefinitionOptionsJson } from "../../databaseExtended.types";

/**
 * This will eventually replace <Text/>
 */
export default function TextGraph({
  data,
  options,
}: {
  data?: { [key: string]: Object };
  options?: DefinitionOptionsJson;
}) {
  if (!data) {
    // skeleton
    return <></>;
  }
  const text = (data[options?.dataKey ?? ""] ?? "").toString();
  return <Typography sx={{ wordBreak: "break-all" }}>{text}</Typography>;
}
