import { createClient } from "@supabase/supabase-js";

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL;
if (anonKey === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
if (supabaseUrl === undefined) {
  throw Error("Missing environment variable NEXT_PUBLIC_SUPABASE_API_URL");
}

// const supabase = createClient<DatabaseExtended>(apiUrl, anonKey, {});
const supabase = createClient(supabaseUrl, anonKey);
export default supabase;
