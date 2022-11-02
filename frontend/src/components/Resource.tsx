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

export default function Resource({ table }: { table: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = useParams();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const { svgUrl } = useStructureUrl(Number(id) || null, prefersDarkMode);

  const { data, error } = useSWR(
    `/${table}/${id}`,
    async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        // .select("*, synonym(*)") // TODO add these back
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

  const synonym = (data?.synonym as any[]) ?? []; // TODO better types

  return (
    <React.Fragment>
      <Typography gutterBottom variant="h6">
        Name
      </Typography>
      <Typography sx={{ wordBreak: "break-all" }}>{data?.name}</Typography>
      <Box>
        {svgUrl && (
          <img alt="structure" src={svgUrl} style={{ maxWidth: "300px" }} />
        )}
      </Box>
      <Typography gutterBottom variant="h6">
        InChI
      </Typography>
      <Typography sx={{ wordBreak: "break-all" }}>{data?.inchi}</Typography>
      <Typography variant="h6">Synonyms</Typography>
      {synonym.length > 0 ? (
        <Grid container spacing={2}>
          {synonym.map((syn) => (
            <React.Fragment key={syn.source}>
              <Grid item xs={12} sm="auto">
                Source: {syn?.source === "chebi_id" ? "ChEBI" : syn?.source}
              </Grid>
              <Grid item xs={12} sm>
                Value:{" "}
                <Link
                  href={`https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${syn?.value}`}
                  target="_blank"
                >
                  {syn?.value}
                  <OpenInNewIcon fontSize="small" sx={{ marginLeft: "4px" }} />
                </Link>
              </Grid>
            </React.Fragment>
          ))}
        </Grid>
      ) : (
        "None"
      )}
    </React.Fragment>
  );
}
