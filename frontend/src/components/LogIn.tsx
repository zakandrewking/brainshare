import { createClient } from "@supabase/supabase-js";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";

if (process.env.REACT_APP_ANON_KEY === undefined)
  throw Error("Missing environment variable REACT_APP_ANON_KEY");
if (process.env.REACT_APP_API_URL === undefined)
  throw Error("Missing environment variable REACT_APP_API_URL");

const supabase = createClient(
  process.env.REACT_APP_API_URL,
  process.env.REACT_APP_ANON_KEY
);

export default function LogIn({ darkMode }: { darkMode: boolean }) {
  return (
    <Auth
      supabaseClient={supabase}
      theme={darkMode ? "dark" : "light"}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "#1976d2",
              brandAccent: "#0f4880",
            },
          },
        },
      }}
    />
  );
}
