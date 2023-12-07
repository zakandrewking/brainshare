import { Fragment } from "react";
import { useNavigate } from "react-router";
import { useSWRConfig } from "swr";

import { useAsyncEffect } from "../hooks/useAsyncEffect";
import supabase from "../supabase";

export default function LogOut() {
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  useAsyncEffect(
    async () => {
      // clear swr cache
      await mutate(() => true, undefined, { revalidate: false });
      await supabase.auth.signOut();
      navigate("/log-in", { replace: true });
    },
    async () => {},
    []
  );

  return <Fragment />;
}
