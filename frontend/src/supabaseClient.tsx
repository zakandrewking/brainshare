import { createClient, Session } from "@supabase/supabase-js";
import {
  useEffect,
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";
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

/**
 * Returns an untyped object, so use lodash `get` to pull out pieces.
 */
export function useDisplayConfig(): any {
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
  if (error) {
    console.error(error);
    return null;
  }
  if (data?.config) {
    return data.config;
  }
  return null;
}

interface AuthState {
  session: Session | null;
}
const initialState = { session: null };
export const AuthContext = createContext<AuthState>(initialState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setState({ session });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw Error("useAuth must be used within AuthProvider");
  return context;
}
