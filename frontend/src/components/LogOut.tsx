import { useNavigate } from "react-router";
import { useEffect, Fragment } from "react";
import supabase, { useAuth } from "../supabase";

export default function LogOut() {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      if (!session) navigate("/log-in", { replace: true });
    });
  }, [navigate, session]);

  return <Fragment />;
}
