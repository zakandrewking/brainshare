import Button from "@mui/material/Button";
import { Box } from "@mui/system";
import { useState } from "react";
import supabase from "../supabaseClient";

export default function Storage() {
  const [svg, setSvg] = useState<string | null>(null);
  const download = async () => {
    const bucketName = "structure_images_svg";
    const { error } = await supabase.storage.getBucket(bucketName);
    if (error) throw Error(error.toString());
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl("48950.svg");
    setSvg(data.publicUrl);
  };
  return (
    <Box>
      <Button onClick={download}>Download</Button>
      {svg && <img alt="structure" src={svg} />}
    </Box>
  );
}
