"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@clerk/nextjs";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/database.types";

// TODO at some point, we should put the supabase db behind a reverse proxy
// https://www.reddit.com/r/Supabase/comments/17er1xs/site_with_supabase_under_attack/
// Brainshare SDKs will not need the anon key or the database URL -- both will
// be provided by AWS load balancer.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL;
if (anonKey === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (apiUrl === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_API_URL");
}

function useSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const { getToken } = useAuth();
  useEffect(() => {
    // TODO clean up this effect ... can we not use an async function?
    (async () => {
      const token = await getToken({ template: "supabase" });
      const supabase = createClient<Database>(apiUrl!, anonKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      setSupabase(supabase);
    })();
  }, [getToken]);
  return supabase;
}

export { useSupabase };
