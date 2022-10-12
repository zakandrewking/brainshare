import supabase from "../supabaseClient";
import { useParams } from "react-router-dom";
import useSWR from "swr";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ChemicalType {
  id: number;
  name: string;
  inchi: string;
}

export default function Chemical() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = useParams();

  const fetcher = async (): Promise<ChemicalType> => {
    const { data, error } = await supabase
      .from("chemical")
      .select("*")
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

  // Loading
  const chemical = data || ({ name: "", id: 0, inchi: "" } as ChemicalType);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography gutterBottom variant="h6">
          Name
        </Typography>
        <Typography sx={{ wordBreak: "break-all" }}>{chemical.name}</Typography>
      </Box>
      <Box>
        <Typography gutterBottom variant="h6">
          InChI
        </Typography>
        <Typography sx={{ wordBreak: "break-all" }}>
          {chemical.inchi}
        </Typography>
      </Box>
    </Stack>
  );
}
