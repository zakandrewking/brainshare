import Chip from "@mui/material/Chip";

import { DefinitionOptionsJson } from "../../databaseExtended.types";

/**
 * will replace PublicPill
 */
export default function PublicPillGraph({
  data,
  options,
}: {
  data?: { [key: string]: Object };
  options?: DefinitionOptionsJson;
}) {
  return data?.[options?.dataKey ?? ""] ? (
    <Chip label="Public" />
  ) : (
    <Chip label="Private" />
  );
}
