import { fetch as _fetch } from "cross-fetch";
import { extend as _extend } from "lodash";
import {
  useEffect,
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { createClient, Session } from "@supabase/supabase-js";

import displayConfig from "./display-config.json";
import { Database } from "./database.types";
import { parseStringTemplate } from "./util/stringUtils";
import useErrorBar from "./components/useErrorBar";

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
async function invoke(functionName: string, method: string, session: Session) {
  const anonKey = process.env.REACT_APP_ANON_KEY;
  const apiUrl = process.env.REACT_APP_API_URL;
  if (anonKey === undefined)
    throw Error("Missing environment variable REACT_APP_ANON_KEY");
  if (apiUrl === undefined)
    throw Error("Missing environment variable REACT_APP_API_URL");

  const url = `${apiUrl}/functions/v1/${functionName}`;
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
  const response = await _fetch(url, {
    method,
    headers,
  }).catch((fetchError) => {
    throw new Error(fetchError);
  });

  const isRelayError = response.headers.get("x-relay-error");
  if (isRelayError && isRelayError === "true") {
    throw new Error(String(response));
  }

  if (!response.ok) {
    throw new Error(String(response));
  }

  return await response.json();
}

interface ApiKey {
  id: string;
  key: string;
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const { session } = useAuth();
  const { showError } = useErrorBar();

  async function createApiKey() {
    if (session === null) throw Error("Not logged in");
    setCreating(true);
    try {
      const { key, id } = await invoke("api-key", "POST", session);
      setApiKey({ key, id });
    } catch (error) {
      console.error(error);
      showError();
    } finally {
      setCreating(false);
    }
  }

  async function revokeApiKey() {
    if (session === null) throw Error("Not logged in");
    if (apiKey === null) throw Error("No API Key");
    setRevoking(true);
    try {
      await invoke(`api-key/${apiKey.id}`, "DELETE", session);
      setApiKey(null);
    } catch (error) {
      console.error(error);
      showError();
    } finally {
      setRevoking(false);
    }
  }

  return { apiKey, createApiKey, revokeApiKey, creating, revoking };
}
