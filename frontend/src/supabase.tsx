import { fetch as _fetch } from "cross-fetch";
import { extend as _extend } from "lodash";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createClient,
  FunctionsHttpError,
  Session,
} from "@supabase/supabase-js";

import { OpenAPI } from "./client";
import { DatabaseExtended } from "./databaseExtended.types";
import { DocStoreContext, docStoreInitialState } from "./stores/DocStore";
import { parseStringTemplate } from "./util/stringUtils";

const anonKey = process.env.REACT_APP_ANON_KEY;
const apiUrl = process.env.REACT_APP_API_URL;
if (anonKey === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (apiUrl === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

const supabase = createClient<DatabaseExtended>(apiUrl, anonKey, {});

export default supabase;

function getStructureUrl(
  obj?: { [index: string]: Object },
  bucketName?: string,
  pathTemplate?: string,
  prefersDarkMode: boolean = false
): string | null {
  if (!bucketName || !pathTemplate) return null;
  const { data } = supabase.storage.from(bucketName).getPublicUrl(
    parseStringTemplate(
      pathTemplate,
      _extend(
        {
          BRAINSHARE_UNDERSCORE_DARK: prefersDarkMode ? "_dark" : "",
        },
        obj as { [index: string]: string } // TODO this is a hack
      )
    )
  );
  return data.publicUrl;
}

export function useStructureUrl(
  obj?: { [index: string]: Object },
  bucketName?: string,
  pathTemplate?: string,
  prefersDarkMode: boolean = false
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

interface AuthState {
  session: Session | null;
  role: string | null;
}
export const AuthContext = createContext<AuthState>({
  session: null,
  role: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { dispatch: docStoreDispatch } = useContext(DocStoreContext);

  // based on https://supabase.com/docs/guides/auth/quickstarts/react
  useEffect(() => {
    // get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // watch for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      if (session === null) {
        setRole(null);
      }
    });

    // clean up
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // After the session is set, get the user's role
  useEffect(() => {
    if (session && role === null) {
      supabase
        .from("user_role")
        .select("role")
        .eq("user_id", session.user.id!)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error(error);
            throw Error("Could not fetch user role");
          }
          if (data?.role) setRole(data.role);
        });
    }
  }, [session, role]);

  // When the auth state changes, configure the backend API client
  useEffect(() => {
    if (session) {
      OpenAPI.HEADERS = {
        Authorization: `Bearer ${session.access_token}`,
      };
    } else {
      OpenAPI.HEADERS = undefined;
    }
  }, [session]);

  // When the auth state is logged out, clear stores
  useEffect(() => {
    if (session === null) {
      docStoreDispatch(docStoreInitialState);
      // TODO how to also cancel any open HTTP request, e.g. an in-progress POST
      // to /annotate
    }
  }, [session, docStoreDispatch]);

  return (
    <AuthContext.Provider value={{ session, role }}>
      {children}
    </AuthContext.Provider>
  );
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
export async function invoke(functionName: string, method: string, data?: any) {
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
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new FunctionsHttpError(response);
  }
  return await response.json();
}
