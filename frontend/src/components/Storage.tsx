import { useEffect, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";

import Box from "@mui/material/Box";

import supabase from "../supabaseClient";

export default function Storage() {
  const [svg, setSvg] = useState<string | null>(null);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  useEffect(() => {
    const download = async () => {
      const bucketName = "structure_images_svg";
      const { error } = await supabase.storage.getBucket(bucketName);
      if (error) throw Error(error.toString());
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`48950${prefersDarkMode ? "_dark" : ""}.svg`);
      setSvg(data.publicUrl);
    };
    download();
  }, [prefersDarkMode]);
  return <Box>{svg && <img alt="structure" src={svg} />}</Box>;
}
