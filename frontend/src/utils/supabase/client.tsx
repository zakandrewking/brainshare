"use client";

import React from "react";

import { mutate } from "swr";

import { createBrowserClient } from "@supabase/ssr";
import { Session } from "@supabase/supabase-js";

import { Database } from "@/database.types";

// TODO at some point, we should put the supabase db behind a reverse proxy
// https://www.reddit.com/r/Supabase/comments/17er1xs/site_with_supabase_under_attack/
// Brainshare SDKs will not need the anon key or the database URL -- both will
// be provided by AWS load balancer.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL;
if (!anonKey) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (!apiUrl) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_API_URL");
}

const supabase = createBrowserClient<Database>(apiUrl, anonKey, {});

export default supabase;

interface AuthState {
  session: Session | null | undefined;
  initialized: boolean;
}
export const AuthContext = React.createContext<AuthState>({
  session: undefined,
  initialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null | undefined>(
    undefined
  );

  // based on https://supabase.com/docs/guides/auth/quickstarts/react
  React.useEffect(() => {
    // get session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // watch for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      // Clear SWR cache and local storage when user logs out
      if (!session) {
        await mutate(() => true, undefined, { revalidate: false });
        localStorage.clear();
      }
    });

    // clean up
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, initialized: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context.initialized) {
    throw Error("useAuth must be used within AuthProvider");
  }
  return context;
}
