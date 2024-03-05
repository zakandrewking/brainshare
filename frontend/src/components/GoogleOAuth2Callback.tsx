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
        throw Error(String(error));
      }
      navigate("/account/google-drive");
    })();

    // TODO react docs say we should not have any of these exceptions
    // https://react.dev/reference/react/useEffect

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{status}</>;
}
