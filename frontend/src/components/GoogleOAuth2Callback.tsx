/**
 * Handle OAuth2 callback from Google.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { invoke } from "../supabase";

export default function GoogleOAuth2Callback() {
  const [status, setStatus] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await invoke("google-token", "POST", {
          authResponseUri: window.location.href,
        });
      } catch (error) {
        setStatus("Something went wrong");
        console.error(error);
        throw Error("Could not invoke google-token");
      }
      // OK if this runs twice, so we'll stick with useEffect
      // TODO get navigation info
      navigate("/");
    })();
  }, [navigate]);

  return <>{status}</>;
}
