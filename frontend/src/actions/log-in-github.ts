"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

export async function logInGithub(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const redirectCode = formData.get("redirectCode");
  const redirectTo =
    redirectCode && redirectCode !== ""
      ? `${baseUrl}/auth/callback?redirectCode=${redirectCode}`
      : `${baseUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
