"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;

export async function logInGithub(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const redirectCode = formData.get("redirect")
    ? formData.get("redirect")
    : "/";
  const redirectTo = `${baseUrl}/auth/callback?next=${redirectCode}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}
