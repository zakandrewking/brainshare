import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Container from "@mui/material/Container";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

import supabase, { useAuth } from "../supabase";

export default function LogIn({ darkMode }: { darkMode: boolean }) {
  /// Navigate away on log in
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate(searchParams.get("redirect") ?? "/account");
  }, [navigate, searchParams, session]);

  return (
    <Container maxWidth="sm">
      <Auth
        supabaseClient={supabase}
        providers={["google"]}
        redirectTo={`https://brainshare.io${
          searchParams.get("redirect") ?? "/account"
        }`}
        onlyThirdPartyProviders={process.env.NODE_ENV !== "development"}
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
    </Container>
  );
}
