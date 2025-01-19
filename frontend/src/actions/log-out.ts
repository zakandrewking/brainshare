"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function logOut(
  _: { error: string | null },
  __: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
