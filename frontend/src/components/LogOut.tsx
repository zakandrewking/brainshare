import { useNavigate } from "react-router";
import { useEffect, Fragment } from "react";
import supabase from "../supabaseClient";

export default function LogOut() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      navigate("/", { replace: true });
    });
  }, [navigate]);

  return <Fragment />;
}
