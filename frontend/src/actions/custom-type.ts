"use server";

import { createClient } from "@/utils/supabase/server";

export async function createCustomType(formData: FormData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Extract and transform form data
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const rules =
      formData
        .get("rules")
        ?.toString()
        .split("\n")
        .filter(Boolean)
        .map((rule) => rule.replace(/^-\s*/, "")) ?? [];
    const examples =
      formData
        .get("examples")
        ?.toString()
        .split("\n")
        .filter(Boolean)
        .map((ex) => ex.replace(/^-\s*/, "")) ?? [];
    const notExamples =
      formData
        .get("not_examples")
        ?.toString()
        .split("\n")
        .filter(Boolean)
        .map((ex) => ex.replace(/^-\s*/, "")) ?? [];
    const sampleValues = JSON.parse(
      (formData.get("sample_values") as string) ?? "[]"
    );

    if (!name || !description) {
      throw new Error("Name and description are required");
    }

    const { data, error } = await supabase
      .from("custom_type")
      .insert({
        name,
        description,
        rules,
        examples,
        not_examples: notExamples,
        sample_values: sampleValues,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("A custom type with this name already exists");
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to create custom type:", error);
    throw error;
  }
}
