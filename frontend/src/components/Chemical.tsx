import React from "react";
import supabase from "../supabaseClient";
import { useParams } from "react-router-dom";
import useSWR from "swr";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

export default function Chemical() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = useParams();

  const fetcher = async () => {
    const { data, error } = await supabase
      .from("chemical")
      .select("*, synonym(*)")
      .eq("id", id)
      .single();
    if (error) throw Error(String(error));
    return data;
  };
  const { data, error } = useSWR(`/chemicals/${id}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

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
      <Typography gutterBottom variant="h6">
        InChI
      </Typography>
      <Typography sx={{ wordBreak: "break-all" }}>{data?.inchi}</Typography>
      <Typography variant="h6">Synonyms</Typography>
      <Grid container spacing={2}>
        {synonym.map((syn) => (
          <React.Fragment>
            <Grid item xs={12} sm="auto">
              Source: {syn?.source}
            </Grid>
            <Grid item xs={12} sm>
              Value: {syn?.value}
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    </React.Fragment>
  );
}
