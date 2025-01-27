"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signUp(
  prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const formValues = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = signUpSchema.safeParse(formValues);
  if (!result.success) {
    return { error: "Invalid email or password" };
  }

  const data = result.data;

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
