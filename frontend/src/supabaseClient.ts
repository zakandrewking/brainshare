import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import useSWR from "swr";

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

export function useDisplayConfig() {
  const { data, error } = useSWR(
    "/display_config",
    async () => {
      const { data, error } = await supabase
        .from("display_config")
        .select("config")
        .limit(1)
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
  if (error) return { error };
  if (!data?.config) {
    return { error: "display_config is missing the config property" };
  }
  return { displayConfig: data.config };
}
