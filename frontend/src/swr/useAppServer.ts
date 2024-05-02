import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "@/database.types";

export type AppType = Database["public"]["Tables"]["app"]["Row"];

export function getAppKey(id: string) {
  return `/apps/${id}`;
}

export async function getApp(
  id: string,
  supabase: SupabaseClient<Database, "public", Database["public"]>
) {
  const { data, error } = await supabase!
    .from("app")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return { app: data, error };
}
