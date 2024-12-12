"use client";

import React from "react";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { isArray } from "remeda";

import { type Provider } from "@supabase/supabase-js";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/utils/supabase/client";

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
    return <div></div>;
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
