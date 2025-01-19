"use client";

import { useUser } from "@/utils/supabase/client";

export default function UserInfo() {
  const { user } = useUser();
  return <div>{user?.email}</div>;
}
