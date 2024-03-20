import { useState, useEffect } from "react";
import { invoke, useAuth } from "../supabase";
import { useScript } from "../hooks/useScript";
import useErrorBar from "./useErrorBar";
import useSWR from "swr";

export interface GoogleDrive {
  accessToken: string | null;

  // returned after gapi is loaded and initialized with an access token
  gapi: any | null;

  // whene one of the steps is in progress. always begins true
  isLoading: boolean;

  // any error that stops gapi from being fully initialized, including a missing
  // access token
  error: string | null;

  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export default function useGoogleDrive(): GoogleDrive {
  const { session } = useAuth();
  const gapiStatus = useScript("https://apis.google.com/js/api.js");
  const { showError } = useErrorBar();
  const [isLoadingByUser, setIsLoadingByUser] = useState(false);
  const [gapiReady, setGapiReady] = useState(false);

  // Load up gapi script
  const {
    data: gapi,
    error: gapiError,
    isLoading: gapiIsLoading,
  } = useSWR(
    gapiStatus === "ready" ? "/gapi" : null,
    async () => {
      const gapiGlobal = (window as any).gapi;
      if (!gapiGlobal) {
        throw Error("window.gapi not found");
      }
      await new Promise((resolve) => {
        gapiGlobal.load("client", () => resolve(null));
      });
      await gapiGlobal.client.init({
        // TODO move this into the backend -- API key should not be public --
        // once supabase supports npm packages in edge functions
        // TODO cache the drive responses
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      });
      return gapiGlobal;
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const {
    data: accessToken,
    error: accessTokenError,
    isLoading: accessTokenIsLoading,
    mutate: mutateAccessToken,
  } = useSWR(
    session ? "/google-token" : null,
    async () => {
      const res = await invoke("google-token", "GET");
      if (res.accessToken) {
        return res.accessToken as string;
      } else if (res.noTokens || res.needsReconnect) {
        return null;
      }
      throw Error("Could not load access token");
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // gapi init with access token
  useEffect(() => {
    if (!gapi || !gapi.client) {
      setGapiReady(false);
    } else {
      gapi.client.setToken({ access_token: accessToken });
      setGapiReady(Boolean(accessToken));
    }
  }, [gapi, accessToken]);

  // handlers
  const signIn = async () => {
    setIsLoadingByUser(true);
    // TODO this would be simpler with tanstack query mutations
    try {
      const res = await invoke("google-token?generateUri=true", "GET");
      if (res.authorizationUri) {
        window.location.href = res.authorizationUri;
      } else if (res.accessToken) {
        mutateAccessToken(res.accessToken);
        setIsLoadingByUser(false);
      }
    } catch (error) {
      setIsLoadingByUser(false);
      showError();
      console.error(error);
      throw Error("Could not invoke google-token");
    }
  };

  const signOut = async () => {
    setIsLoadingByUser(true);
    try {
      await invoke("google-token", "DELETE");
      mutateAccessToken(null);
      setIsLoadingByUser(false);
    } catch (error) {
      setIsLoadingByUser(false);
      showError();
      console.error(error);
      throw Error("Could not invoke google-token (DELETE)");
    }
  };

  const errorObj = gapiError || accessTokenError;
  const error = errorObj ? String(errorObj) : null;
  const isLoading = gapiIsLoading || accessTokenIsLoading || isLoadingByUser;

  return {
    accessToken: accessToken || null,
    gapi: gapiReady ? gapi : null,
    isLoading,
    error,
    signIn,
    signOut,
  };
}
