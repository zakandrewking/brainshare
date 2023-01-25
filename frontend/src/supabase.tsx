import { fetch as _fetch } from "cross-fetch";
import { extend as _extend } from "lodash";
import {
  useEffect,
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";
import {
  createClient,
  FunctionsHttpError,
  Session,
} from "@supabase/supabase-js";

import displayConfig from "./display-config.json";
import { Database } from "./database.types";
import { parseStringTemplate } from "./util/stringUtils";

const anonKey = process.env.REACT_APP_ANON_KEY;
const apiUrl = process.env.REACT_APP_API_URL;
if (anonKey === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (apiUrl === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

const supabase = createClient<Database>(apiUrl, anonKey, {});

export default supabase;

function getStructureUrl(
  obj: { [index: string]: string },
  bucketName: string,
  pathTemplate: string,
  prefersDarkMode: boolean
) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(
    parseStringTemplate(
      pathTemplate,
      _extend(
        {
          BRAINSHARE_UNDERSCORE_DARK: prefersDarkMode ? "_dark" : "",
        },
        obj
      )
    )
  );
  return data.publicUrl;
}

export function useStructureUrl(
  obj: { [index: string]: string } | null,
  bucketName: string,
  pathTemplate: string,
  prefersDarkMode: boolean
) {
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  useEffect(() => {
    setSvgUrl(
      obj
        ? getStructureUrl(obj, bucketName, pathTemplate, prefersDarkMode)
        : null
    );
  }, [obj, bucketName, pathTemplate, prefersDarkMode]);
  return { svgUrl };
}

/**
 * Returns an untyped object, so use lodash `get` to pull out pieces.
 */
export function useDisplayConfig(): any {
  return displayConfig;
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

/**
 * Invoke a supabase function. We do not use the version provided in supabase-js
 * because it does not support HTTP methods other than POST.
 */
export async function invoke(functionName: string, method: string) {
  const anonKey = process.env.REACT_APP_ANON_KEY;
  const apiUrl = process.env.REACT_APP_API_URL;
  if (anonKey === undefined)
    throw Error("Missing environment variable REACT_APP_ANON_KEY");
  if (apiUrl === undefined)
    throw Error("Missing environment variable REACT_APP_API_URL");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw Error("Not logged in");

  // from SupabaseClient.ts
  const isPlatform = apiUrl.match(/(supabase\.co)|(supabase\.in)/);
  let functionsUrl = "";
  if (isPlatform) {
    const urlParts = apiUrl.split(".");
    functionsUrl = `${urlParts[0]}.functions.${urlParts[1]}.${urlParts[2]}`;
  } else {
    functionsUrl = `${apiUrl}/functions/v1`;
  }

  const url = `${functionsUrl}/${functionName}`;
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };

  const response = await _fetch(url, {
    method,
    headers,
  });
  if (!response.ok) {
    throw new FunctionsHttpError(response);
  }
  return await response.json();
}
