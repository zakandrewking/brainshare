import { get as _get } from "lodash";
import { Fragment } from "react";

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { DefinitionOptionsJson } from "../../databaseExtended.types";
import {
  capitalizeFirstLetter,
  parseStringTemplate,
} from "../../util/stringUtils";
import { LinkOut } from "../links";

/**
 * This will eventually replace <SourceValue/>
 */
export default function SourceValueGraph({
  data,
  options,
  specialCapitalize = null,
}: {
  data?: { [key: string]: any };
  options?: DefinitionOptionsJson;
  specialCapitalize?: any;
}) {
  if (!data) {
    // skeleton
    return <></>;
  }
  const dataRow = data[options?.dataKey ?? ""] ?? [];
  return dataRow.length > 0 ? (
    <Grid container spacing={2}>
      {dataRow.map((synonym: any, i: number) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        const linkTemplate = _get(options, [
          "optionsTable",
          source,
          "linkTemplate",
        ]);
        return (
          <Fragment key={i}>
            <Grid item>
              {_get(specialCapitalize, [source], capitalizeFirstLetter(source))}
              {": "}
              {linkTemplate ? (
                <LinkOut href={parseStringTemplate(linkTemplate, { value })}>
                  {value}
                </LinkOut>
              ) : (
                value
              )}
            </Grid>
          </Fragment>
        );
      })}
    </Grid>
  ) : (
    <Typography>None</Typography>
  );
}
