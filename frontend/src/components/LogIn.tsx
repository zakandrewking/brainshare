import { createClient } from "@supabase/supabase-js";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";

const supabase = createClient(
  "http://localhost:54321",
  "" // TODO secrets
);

export default function LogIn() {
  return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
}
