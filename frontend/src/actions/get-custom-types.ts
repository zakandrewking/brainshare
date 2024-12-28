"use server";

import { ColumnTypeDefinition } from "@/utils/column-types";
import { createClient } from "@/utils/supabase/server";

export async function getCustomTypes(): Promise<ColumnTypeDefinition[]> {
  try {
    const supabase = await createClient();

    const { data: customTypes, error } = await supabase
      .from("custom_type")
      .select("*");

    if (error) throw error;

    return customTypes.map((type) => ({
      name: type.name,
      description: type.description,
      examples: type.examples as string[],
      not_examples: type.not_examples as string[],
      rules: type.rules as string[],
      is_custom: true,
    }));
  } catch (error) {
    console.error("Failed to fetch custom types:", error);
    throw error;
  }
}
