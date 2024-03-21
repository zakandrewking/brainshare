import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Container from "@mui/material/Container";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Provider } from "@supabase/supabase-js";

import supabase, { useAuth } from "../supabase";

const frontendUrl = process.env.REACT_APP_FRONTEND_URL;
if (frontendUrl === undefined) throw Error("Missing REACT_APP_FRONTEND_URL");

export default function LogIn({ darkMode }: { darkMode: boolean }) {
  /// Navigate away on log in
  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate(searchParams.get("redirect") ?? "/account");
  }, [navigate, searchParams, session]);

  const BaseAuth = ({
    providers,
    onlyThirdPartyProviders = true,
    providerScopes,
    queryParams,
  }: {
    providers: Provider[];
    onlyThirdPartyProviders?: boolean;
    providerScopes?: { [key: string]: string };
    queryParams?: { [index: string]: string };
  }) => {
    return (
      <Auth
        providers={providers}
        queryParams={queryParams}
        onlyThirdPartyProviders={onlyThirdPartyProviders}
        providerScopes={providerScopes}
        supabaseClient={supabase}
        redirectTo={`${frontendUrl}${
          searchParams.get("redirect") ?? "/account"
        }`}
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
  };

  return (
    <Container maxWidth="sm">
      <BaseAuth providers={["github"]} />
      <BaseAuth
        providers={["google"]}
        queryParams={{
          // see also google-token function
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        }}
        providerScopes={{
          google: "https://www.googleapis.com/auth/drive.file",
        }}
        // onlyThirdPartyProviders={process.env.NODE_ENV !== "development"}
      />
    </Container>
  );
}
