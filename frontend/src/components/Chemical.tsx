import { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import { useParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function Chemical() {
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<String>("");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = useParams();

  useEffect(() => {
    const getChemical = async () => {
      const { data, error } = await supabase
        .from("chemical")
        .select("*")
        .eq("id", id)
        .single();
      setData(data);
      setError((error || "").toString());
    };
    getChemical();
  }, [id]);

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography gutterBottom variant="h6">
          Name
        </Typography>
        <Typography sx={{ wordBreak: "break-all" }}>{data.name}</Typography>
      </Box>
      <Box>
        <Typography gutterBottom variant="h6">
          InChI
        </Typography>
        <Typography sx={{ wordBreak: "break-all" }}>{data.inchi}</Typography>
      </Box>
    </Stack>
  );
}
