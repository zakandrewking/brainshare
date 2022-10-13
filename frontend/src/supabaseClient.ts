import { createClient } from "@supabase/supabase-js";
import { Database } from './database.types'

if (process.env.REACT_APP_ANON_KEY === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (process.env.REACT_APP_API_URL === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

const supabase = createClient<Database>(
  process.env.REACT_APP_API_URL,
  process.env.REACT_APP_ANON_KEY
);
export default supabase;
