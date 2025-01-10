"use server";

import { type TableStoreState } from "@/stores/table-store";
import { createClient } from "@/utils/supabase/server";

export async function saveTableIdentifications(
  prefixedId: string,
  state: TableStoreState
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Convert Sets to Arrays and stringify for JSON compatibility
    const serializableIdentifications = {
      hasHeader: state.hasHeader,
      identifications: state.identifications,
      redisMatchData: state.redisMatchData,
      redisInfo: state.redisInfo,
      stats: state.stats,
      typeOptions: state.typeOptions,
      prefixedId: state.prefixedId,
      redisMatches: Object.fromEntries(
        Object.entries(state.redisMatches).map(([k, v]) => [k, Array.from(v)])
      ),
    };

    const { error } = await supabase
      .from("table_identification")
      .upsert(
        {
          prefixed_id: prefixedId,
          user_id: user.id,
          identifications: JSON.stringify(serializableIdentifications),
        },
        {
          onConflict: "prefixed_id,user_id",
        }
      )
      .select();

    if (error) {
      throw error;
    } else {
      console.log("Saved identifications");
    }
  } catch (error) {
    console.error("Failed to save identifications:", error);
    throw new Error("Backend is unreachable");
  }
}

export async function loadTableIdentifications(
  prefixedId: string
): Promise<TableStoreState | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  // Parse JSON and convert Arrays back to Sets
  if (typeof data.identifications !== "string")
    throw new Error("Invalid identifications format");
  const stored = JSON.parse(data.identifications);
  return {
    hasHeader: stored.hasHeader,
    identifications: stored.identifications,
    redisMatchData: stored.redisMatchData,
    redisInfo: stored.redisInfo,
    stats: stored.stats,
    typeOptions: stored.typeOptions,
    prefixedId: stored.prefixedId,
    redisMatches: Object.fromEntries(
      Object.entries(stored.redisMatches || {}).map(([k, v]) => [
        k,
        new Set(v as string[]),
      ])
    ),
    // Initialize status fields with defaults
    identificationStatus: {},
    redisStatus: {},
    isSaving: false,
  };
}
