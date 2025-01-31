"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

export async function logInGithub(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // const redirectTo = formData.get("redirect")
  //   ? `${baseUrl}/${formData.get("redirect")}`
  //   : `${baseUrl}/`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${baseUrl}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
