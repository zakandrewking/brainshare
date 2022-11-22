import { get as _get } from "lodash";
import { useDisplayConfig } from "../supabaseClient";
import { useParams } from "react-router-dom";
import React from "react";
import supabase, { useStructureUrl } from "../supabaseClient";
import useMediaQuery from "@mui/material/useMediaQuery";
import useSWR from "swr";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Typography from "@mui/material/Typography";
import { capitalizeFirstLetter } from "../util/stringUtils";

/// Evaluate a template string at runtime
function parseStringTemplate(
  template: string,
  obj: { [index: string]: string }
): string {
  let parts = template.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/);
  let args = template.match(/[^{}]+(?=})/g) || [];
  let parameters = args.map(
    (argument) =>
      obj[argument] || (obj[argument] === undefined ? "" : obj[argument])
  );
  return String.raw({ raw: parts }, ...parameters);
}

function KeyValue({
  data,
  valueUrl = null,
}: {
  data: any;
  valueUrl?: string | null;
}) {
  return data.length > 0 ? (
    <Grid container spacing={2}>
      {data.map((synonym: any) => {
        const source = _get(synonym, ["source"], "");
        const value = _get(synonym, ["value"], "");
        return (
          <React.Fragment key={source}>
            <Grid item xs={12} sm="auto">
              Source: {source === "chebi_id" ? "ChEBI" : source}
            </Grid>
            <Grid item xs={12} sm>
              Value:{" "}
              {valueUrl ? (
                <Link
                  href={parseStringTemplate(valueUrl, { value })}
                  target="_blank"
                >
                  {value}
                  <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
                </Link>
              ) : (
                value
              )}
            </Grid>
          </React.Fragment>
        );
      })}
    </Grid>
  ) : (
    <Typography>None</Typography>
  );
}

export default function Resource({ table }: { table: string }) {
  const { id } = useParams();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { svgUrl } = useStructureUrl(Number(id) || null, prefersDarkMode);

  const displayConfig = useDisplayConfig();
  // const specialCapitalize = _get(displayConfig, "specialCapitalize", {});
  const detailProperties: string[] = _get(
    displayConfig,
    ["detailProperties", table],
    {}
  );
  const joinResources: string[] = _get(
    displayConfig,
    ["joinResources", table],
    []
  );
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});
  const joinSelectString =
    joinResources.length === 0
      ? ""
      : ", " + joinResources.map((x) => x + "(*)").join(",");

  const { data, error } = useSWR(
    `/${table}/${id}`,
    async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*" + joinSelectString)
        .eq("id", id)
        .single();
      if (error) throw Error(String(error));
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <React.Fragment>
      {detailProperties.map((prop) => {
        const type = _get(propertyTypes, [prop, "type"]);
        const valueLink = _get(propertyTypes, [prop, "value_link"]);
        const propData = _get(data, [prop], "");
        return (
          <React.Fragment key={prop}>
            <Typography gutterBottom variant="h6">
              {capitalizeFirstLetter(prop)}
            </Typography>
            {type === "key_value" ? (
              <KeyValue data={propData} valueUrl={valueLink}></KeyValue>
            ) : (
              <Typography sx={{ wordBreak: "break-all" }}>
                {propData.toString()}
              </Typography>
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}
