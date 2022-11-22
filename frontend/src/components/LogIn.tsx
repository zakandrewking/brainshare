import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import supabase from "../supabaseClient";

export default function LogIn({ darkMode }: { darkMode: boolean }) {
  /// Navigate away on log in
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate(searchParams.get("redirect") || "/");
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

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
