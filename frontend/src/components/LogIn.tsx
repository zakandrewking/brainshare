import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Container from "@mui/material/Container";

import supabase, { useAuth } from "../supabaseClient";

export default function LogIn({ darkMode }: { darkMode: boolean }) {
  /// Navigate away on log in
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const { session } = useAuth();
  useEffect(() => {
    if (session) navigate(searchParams.get("redirect") || "/");
  }, [navigate, searchParams, session]);

  return (
    <Container maxWidth="sm">
      <Auth
        supabaseClient={supabase}
        providers={["github"]}
        redirectTo={`https://brainshare.io/metabolism${
          searchParams.get("redirect") || ""
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
