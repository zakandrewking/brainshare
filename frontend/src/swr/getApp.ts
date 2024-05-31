import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/database.types";

export type AppType = Database["public"]["Tables"]["app"]["Row"];

export function getAppKey(id: string) {
  return `/apps/${id}`;
}

export default async function getApp(
  id: string,
  supabase: SupabaseClient<Database, "public", Database["public"]>
) {
  const { data, error } = await supabase!
    .from("app")
    .select("*, app_db_file(created_at, file(*))")
    .eq("id", id)
    .order("created_at", {
      referencedTable: "app_db_file",
      ascending: false,
    })
    .maybeSingle();
  if (error) throw error;
  return { app: data, error };
}
