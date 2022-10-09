import { Auth, ThemeSupa } from "@supabase/auth-ui-react";

import supabase from "../supabaseClient";

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
