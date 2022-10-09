import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

export default function Chemicals() {
  const [data, setData] = useState<any>([]);
  const [error, setError] = useState<String>("");

  useEffect(() => {
    getChemicals();
  }, []);

  async function getChemicals() {
    const { data, error } = await supabase.from("chemical").select();
    setError((error || "").toString());
    setData(data);
  }

  if (error) {
    console.error(error);
    return <Box>Something went wrong. Try again.</Box>;
  }

  return <Box>{data}</Box>;
}
