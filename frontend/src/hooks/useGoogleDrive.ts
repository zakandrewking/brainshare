import { useState, useEffect } from "react";
import { invoke, useAuth } from "../supabase";
import { useScript } from "../hooks/useScript";
import useErrorBar from "./useErrorBar";

interface GoogleDrive {
  // null if it doesn't exist; expired?
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

  const [gapi, setGapi] = useState<any>(null);
  const [gapiInitialiazed, setGapiInitialized] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useErrorBar();

  // Load up gapi script
  useEffect(() => {
    if (gapiStatus === "ready") {
      try {
        const gapiGlobal = (window as any).gapi;
        gapiGlobal.load("client", () => {
          try {
            setGapi(gapiGlobal);
          } catch (error) {
            console.error(error);
            setError("Could not set gapi script");
            setIsLoading(false);
            setAccessToken(null);
            setGapiInitialized(null);
          }
        });
      } catch (error) {
        console.error(error);
        setError("Could not load gapi script");
        setIsLoading(false);
        setAccessToken(null);
        setGapiInitialized(null);
      }
    }
  }, [gapiStatus]);

  // On load, check for access token
  useEffect(() => {
    if (!session) {
      setError("No session found");
      setAccessToken(null);
      setGapiInitialized(null);
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await invoke("google-token", "GET");
        if (res.accessToken && accessToken !== res.accessToken) {
          setError(null);
          setGapiInitialized(null);
          setAccessToken(res.accessToken);
          console.log("got access token; still loading");
          setIsLoading(true);
        } else if (res.noTokens || res.needsReconnect) {
          setError(null);
          setGapiInitialized(null);
          setAccessToken(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(error);
        setError("Could not load access token");
        setGapiInitialized(null);
        setAccessToken(null);
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // gapi init with access token
  useEffect(() => {
    (async () => {
      if (gapi === null || accessToken === null || session === null) {
        // just waiting
        return;
      }
      try {
        await gapi.client.init({
          // TODO move this into the backend -- API key should not be public --
          // once supabase supports npm packages in edge functions
          // TODO cache the drive responses
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        });
      } catch (error) {
        console.error(error);
        setError("Could not initialize gapi");
        setIsLoading(false);
        setGapiInitialized(null);
      }
      gapi.client.setToken({ access_token: accessToken });
      setError(null);
      setGapiInitialized(gapi);
      console.log("gapi initialized; not loading");
      setIsLoading(false);
    })();
  }, [gapi, accessToken, session]);

  // methods
  const signIn = async () => {
    console.log("signing in; still loading");
    setIsLoading(true);
    setAccessToken(null);
    setGapiInitialized(null);
    setError(null);
    try {
      const res = await invoke("google-token?generateUri=true", "GET");
      if (res.authorizationUri) {
        window.location.href = res.authorizationUri;
      } else if (res.accessToken) {
        setAccessToken(res.accessToken);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showError();
      throw Error("Could not invoke google-token");
    }
  };

  const signOut = async () => {
    console.log("signing out; still loading");
    setIsLoading(true);
    setAccessToken(null);
    setGapiInitialized(null);
    setError(null);
    try {
      await invoke("google-token", "DELETE");
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      showError();
      throw Error("Could not invoke google-token (DELETE)");
    }
  };

  return {
    accessToken,
    // only return gapi once it's initialized
    gapi: gapiInitialiazed,
    isLoading,
    error,
    signIn,
    signOut,
  };
}
