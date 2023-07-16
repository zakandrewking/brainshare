import { useMediaQuery } from "@mui/material";

import { DefinitionOptionsJson } from "../../databaseExtended.types";
import { useStructureUrl } from "../../supabase";

/**
 * This will eventually replace <Svg/>
 */
export default function SvgGraph({
  data,
  options,
}: {
  data?: { [key: string]: Object };
  options?: DefinitionOptionsJson;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(
    data,
    options?.bucket,
    options?.pathTemplate,
    prefersDarkMode
  );

  if (!data || !svgUrl) {
    // skeleton
    return <></>;
  }

  return (
    <img
      style={{
        height: `${options?.height || 100}px`,
        width: `${options?.width || 400}px`,
      }}
      alt="structure"
      src={svgUrl}
    />
  );
}
