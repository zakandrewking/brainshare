// NOTES on useEffect and async. docs suggest useSwr or equivalent
// https://react.dev/reference/react/useEffect we should keep this note here
// because i will almost certainly try to do useEffect + fetch again TanStack
// query might be better than useswr if we need to wrap the progress of an API
// mutation. see:
// https://tanstack.com/query/latest/docs/framework/react/guides/mutations
// https://github.com/TanStack/query/issues/5341
// https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development

import { fetch as _fetch } from "cross-fetch";
// TODO drop lodash
import { extend as _extend } from "lodash";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createClient,
  FunctionsHttpError,
  Session,
} from "@supabase/supabase-js";
import { PostgrestClient } from "@supabase/postgrest-js";

import { OpenAPI } from "./client";
import { DatabaseExtended } from "./databaseExtended.types";
import { DocStoreContext, docStoreInitialState } from "./stores/DocStore";
import { parseStringTemplate } from "./util/stringUtils";
import useSWR, { mutate } from "swr";
import { FileStoreContext, fileStoreInitialState } from "./stores/FileStore";
import { ChatStoreContext, chatStoreInitialState } from "./stores/ChatStore";
import {
  CurrentProjectStoreContext,
  currentProjectInitialState,
} from "./stores/CurrentProjectStore";

// TODO at some point, we should put the supabase db behind a reverse proxy
// https://www.reddit.com/r/Supabase/comments/17er1xs/site_with_supabase_under_attack/
// Brainshare SDKs will not need the anon key or the database URL -- both will
// be provided by AWS load balancer.
const anonKey = process.env.REACT_APP_ANON_KEY;
const apiUrl = process.env.REACT_APP_API_URL;
if (anonKey === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (apiUrl === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

export const GATEWAY_URL = process.env.REACT_APP_GATEWAY_URL;
if (GATEWAY_URL === undefined) {
  throw Error("Missing environment variable REACT_APP_GATEWAY_URL");
}

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
  session: Session | null | undefined;
  username: string | null | undefined;
  roles: string[] | null | undefined;
  dataClient: PostgrestClient<any, string, any> | null;
}
export const AuthContext = createContext<AuthState>({
  session: undefined,
  username: null,
  roles: null,
  dataClient: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { dispatch: docStoreDispatch } = useContext(DocStoreContext);
  const { dispatch: fileStoreDispatch } = useContext(FileStoreContext);
  const { dispatch: chatStoreDispatch } = useContext(ChatStoreContext);
  const { dispatch: currentProjectStoreDispatch } = useContext(
    CurrentProjectStoreContext
  );

  // based on https://supabase.com/docs/guides/auth/quickstarts/react
  useEffect(() => {
    // get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // watch for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // update the token in the database (async, don't wait for it to finish)
      if (
        session &&
        session.provider_token &&
        session.user.app_metadata.provider
      ) {
        // get provider name
        let providerName;
        try {
          providerName = session.user.identities?.filter(
            (i) =>
              i.identity_data?.iss &&
              i.identity_data.iss === session.user.user_metadata.iss
          )[0].provider;
        } catch (e) {}
        if (providerName) {
          // Don't wait for this to finish or supabase auth won't work as expected
          invoke("update-token", "POST", {
            providerName,
            accessToken: session.provider_token,
            ...(session.provider_refresh_token && {
              refreshToken: session.provider_refresh_token,
              expiresAt: new Date(session.expires_at! * 1000).toISOString(),
            }),
          });
        }
      }
    });

    // clean up
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // After the session is set, get the user account info & role
  const { data: user } = useSWR(
    session ? "/user&join=user_role" : null,
    async () => {
      const { data, error } = await supabase
        .from("user")
        .select("*, user_role(*)")
        .eq("user_id", session!.user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        throw Error("Could not fetch user role");
      }
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Data access token
  const { data: dataJwt } = useSWR(
    session ? "/create_data_jwt" : null,
    async () => {
      const { data, error } = await supabase.rpc("create_data_jwt");
      if (error) {
        console.error(error);
        throw Error("Could not create data access token");
      }
      if (!data) throw Error("Missing data access token");
      return data;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Data access client
  const dataClient = useMemo(() => {
    if (!dataJwt || !session) return null;
    const dataSchema = `data_${session.user.id.replaceAll("-", "_")}`;
    const dataApi = `${apiUrl}/rest/v1`;
    return new PostgrestClient(dataApi, {
      headers: {
        Apikey: anonKey!,
        Authorization: `Bearer ${dataJwt}`,
      },
      schema: dataSchema,
      // TODO deal with expiration. Need to add a middleware that looks for an
      // expired token and then mutates "create_data_jwt".
      // fetch: async (...args) => {
      //   const res = _fetch(...args);
      //   if (res.status == "PGRST301") {
      //     // expired token
      //     dataJwtMutate();
      //     // TODO how to wait for the new token and then refetch?
      //   }
      //   return Promise.resolve(res);
      // },
    });
  }, [dataJwt, session]);

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
      fileStoreDispatch(fileStoreInitialState);
      chatStoreDispatch(chatStoreInitialState);
      currentProjectStoreDispatch(currentProjectInitialState);
    }
  }, [
    session,
    docStoreDispatch,
    fileStoreDispatch,
    chatStoreDispatch,
    currentProjectStoreDispatch,
  ]);

  const username = user ? user.username : user;
  const roles = user ? user.user_role.map((x) => x.role) : user;

  return (
    <AuthContext.Provider value={{ session, username, roles, dataClient }}>
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

export async function logOut(navigate: (path: string, options?: any) => void) {
  // clear swr cache
  await mutate(() => true, undefined, { revalidate: false });
  // sign out
  await supabase.auth.signOut();
  // navigate
  navigate("/log-in", { replace: true });
}
