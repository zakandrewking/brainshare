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

export default function LogIn() {
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "rgb(85, 22, 123)",
              brandAccent: "rgb(136, 41, 193)",
            },
          },
        },
      }}
    />
  );
}
