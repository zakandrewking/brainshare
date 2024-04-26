import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

import { Database } from "@/database.types";

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL;
if (anonKey === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (apiUrl === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_API_URL");
}

/**
 * Supabase client for server components.
 */
export async function getSupabase() {
  const { getToken } = auth();
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
  return supabase;
}
