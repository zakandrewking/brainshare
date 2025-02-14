"use client";

import React from "react";

import {
  type Client,
  createClient as createBackendClient,
  createConfig,
} from "@hey-api/client-next";
import { Session } from "@supabase/supabase-js";

import type { ClientOptions } from "@/client/types.gen";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const BackendContext = React.createContext<Client | null>(null);

function newClient(token?: string) {
  const config = {
    ...createConfig<ClientOptions>(),
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  };
  const client = createBackendClient(config);
  if (token) {
    client.interceptors.request.use((options) => {
      if (
        typeof options.headers === "object" &&
        "set" in options.headers &&
        typeof options.headers.set === "function"
      ) {
        options.headers.set("Authorization", `Bearer ${token}`);
      }
    });
  }
  return client;
}

export function BackendProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [client, setClient] = React.useState<Client | null>(null);

  // add auth header to all requests
  React.useEffect(() => {
    if (session) {
      // Set auth header for the autogen client
      const supabase = createSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setClient(newClient(session.access_token));
        }
      });
    } else {
      // Clear auth header from the autogen client
      setClient(newClient());
    }
  }, [session]);

  return (
    <BackendContext.Provider value={client}>{children}</BackendContext.Provider>
  );
}

export function useBackend() {
  const client = React.useContext(BackendContext);
  if (!client) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return client;
}
