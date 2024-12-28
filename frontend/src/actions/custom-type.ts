"use server";

import { createClient } from "@/utils/supabase/server";

interface TableIdentification {
  prefixed_id: string;
  identifications: {
    [key: number]: {
      type: string;
      description: string;
    };
  };
  user_id: string;
}

export async function createCustomType(
  prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
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

    // Get the column info
    const { columnIndex, returnUrl } = formData.get("columnInfo");

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

    // Update the column type in the table store
    const prefixedId = returnUrl.split("/").pop()?.split("?")[0];
    if (prefixedId && columnIndex !== undefined) {
      const { data: existingIdentifications } = await supabase
        .from("table_identification")
        .select("*")
        .eq("prefixed_id", prefixedId)
        .single();

      const identifications = (existingIdentifications?.identifications ||
        {}) as TableIdentification["identifications"];
      identifications[columnIndex] = {
        type: name,
        description: description,
      };

      await supabase.from("table_identification").upsert({
        prefixed_id: prefixedId,
        identifications,
        user_id: user.id,
      });
    }

    // // Revalidate the table page to reflect the changes
    // revalidatePath(returnUrl);

    return { error: null };
  } catch (error) {
    console.error("Failed to create custom type:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create custom type",
    };
  }
}
