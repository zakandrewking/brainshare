import { createClient, Session } from "@supabase/supabase-js";
import {
  useEffect,
  useState,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { extend as _extend } from "lodash";
import displayConfig from "./display-config.json";

import { parseStringTemplate } from "./util/stringUtils";

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

// export function useStructureUrls(ids: number[], prefersDarkMode: boolean) {
//   const [structureUrls, setStructureUrls] = useState<{ [key: number]: string }>(
//     {}
//   );
//   useEffect(() => {
//     setStructureUrls(
//       ids.reduce(
//         (obj, id) => ({
//           ...obj,
//           [id]: getStructureUrl(id, prefersDarkMode),
//         }),
//         {}
//       )
//     );
//   }, [ids, prefersDarkMode]);
//   return { structureUrls };
// }

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
