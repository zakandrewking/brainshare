import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { Database } from "./database.types";

if (process.env.REACT_APP_ANON_KEY === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (process.env.REACT_APP_API_URL === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

const supabase = createClient<Database>(
  process.env.REACT_APP_API_URL,
  process.env.REACT_APP_ANON_KEY
);

export default supabase;

function getStructureUrl(id: number, prefersDarkMode: boolean) {
  const bucketName = "structure_images_svg";
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(`${id}${prefersDarkMode ? "_dark" : ""}.svg`);
  return data.publicUrl;
}

export function useStructureUrl(id: number | null, prefersDarkMode: boolean) {
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  useEffect(() => {
    setSvgUrl(id ? getStructureUrl(id, prefersDarkMode) : null);
  }, [id, prefersDarkMode]);
  return { svgUrl };
}

export function useStructureUrls(ids: number[], prefersDarkMode: boolean) {
  const [structureUrls, setStructureUrls] = useState<{ [key: number]: string }>(
    {}
  );
  useEffect(() => {
    setStructureUrls(
      ids.reduce(
        (obj, id) => ({
          ...obj,
          [id]: getStructureUrl(id, prefersDarkMode),
        }),
        {}
      )
    );
  }, [ids, prefersDarkMode]);
  return { structureUrls };
}
