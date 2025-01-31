"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { decodeRedirect } from "@/utils/url";

export async function logIn(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  if (formData.get("redirectCode") && formData.get("redirectCode") !== "") {
    redirect(decodeRedirect(formData.get("redirectCode") as string));
  } else {
    redirect("/");
  }
}
