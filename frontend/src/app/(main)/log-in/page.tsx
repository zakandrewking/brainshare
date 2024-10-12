"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React from "react";
import { isArray } from "remeda";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Provider } from "@supabase/supabase-js";

import { useMediaQuery } from "@/hooks/use-media-query";
import supabase, { useAuth } from "@/lib/supabaseClient";

const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
if (!frontendUrl) {
  throw Error("Missing environment variable NEXT_PUBLIC_FRONTEND_URL");
}

export default function LogIn({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { session } = useAuth();

  const router = useRouter();

  const { theme } = useTheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const darkMode = theme === "dark" || (theme === "system" && prefersDark);

  const redirect = searchParams["redirect"] ?? "/account";
  const redirectFirst = isArray(redirect) ? redirect[0] : redirect;

  React.useEffect(() => {
    if (session) router.push(redirectFirst);
  }, [redirectFirst, router, searchParams, session]);

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
        redirectTo={`${frontendUrl}${redirectFirst}`}
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
    <div className="px-6 flex flex-row justify-center">
      <div className="w-full max-w-md">
        <BaseAuth
          providers={["github", "google"]}
          onlyThirdPartyProviders={process.env.NODE_ENV !== "development"}
        />
      </div>
    </div>
  );
}
