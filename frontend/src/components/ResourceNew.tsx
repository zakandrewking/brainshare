import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../supabaseClient";

export default function ResourceNew() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate(`/log-in?redirect=${location.pathname}`);
    }
  }, [session, navigate, location]);

  return <div>New</div>;
}
