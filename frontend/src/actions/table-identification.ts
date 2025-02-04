"use server";

import { z } from "zod";

import { type IdentificationDataState } from "@/stores/identification-store";
import { getUser } from "@/utils/supabase/server";

// The records that will be stored in the database
const TableIdentificationsSchema = z.object({
  activeFilters: z.array(
    z.object({
      column: z.number(),
      type: z.enum(["valid-only", "invalid-only"]),
    })
  ),
  hasHeader: z.boolean(),
  identifications: z.record(
    z.string(),
    z.object({
      type: z.string(),
      description: z.string(),
      suggestedActions: z.array(z.string()).optional(),
      is_custom: z.boolean(),
      id: z.string().optional(),
      name: z.string().optional(),
      kind: z.string().optional(),
      min_value: z.number().optional(),
      max_value: z.number().optional(),
      log_scale: z.boolean().optional(),
    })
  ),
  stats: z.record(z.string(), z.any()),
  redisMatchData: z.record(z.string(), z.any()),
  redisInfo: z.record(z.string(), z.any()),
  redisMatches: z.record(z.string(), z.any()),
  typeOptions: z.record(z.string(), z.any()),
  redisStatus: z.record(z.string(), z.any()),
});

export type TableIdentifications = Pick<
  IdentificationDataState,
  keyof z.infer<typeof TableIdentificationsSchema>
>;

export async function saveTableIdentifications(
  prefixedId: string,
  data: IdentificationDataState
) {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = TableIdentificationsSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Failed to parse state:", parsed.error);
    throw new Error("Invalid state format");
  }

  const { error } = await supabase
    .from("table_identification")
    .upsert(
      {
        prefixed_id: prefixedId,
        user_id: user.id,
        identifications: JSON.stringify(parsed.data),
      },
      {
        onConflict: "prefixed_id,user_id",
      }
    )
    .select();

  if (error) {
    console.error("Failed to save identifications:", error);
    throw error;
  } else {
    console.log("Saved identifications");
  }
}

export async function loadTableIdentifications(
  prefixedId: string
): Promise<TableIdentifications | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("table_identification")
    .select("identifications")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  if (typeof data.identifications !== "string")
    throw new Error("Invalid identifications format");

  const stored = TableIdentificationsSchema.safeParse(
    JSON.parse(data.identifications)
  );

  if (!stored.success) {
    throw new Error("Failed to parse identifications:", stored.error);
  }

  console.log("Loaded identifications");
  return stored.data;
}
