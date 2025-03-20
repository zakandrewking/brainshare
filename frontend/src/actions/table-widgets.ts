"use server";

import { z } from "zod";

import { WidgetDataState } from "@/stores/widget-store";
import { getUser } from "@/utils/supabase/server";

const TableWidgetsSchema = z.object({
  widgets: z.array(
    z.object({
      id: z.string().optional(),
      engine: z.string(),
      type: z.string(),
      name: z.string(),
      description: z.string(),
      vegaLiteSpec: z.record(z.any()).optional(),
      observablePlotCode: z.string().optional(),
      isSuggested: z.boolean(),
      displayOrder: z.number().optional(),
    })
  ),
});

export type TableWidgets = z.infer<typeof TableWidgetsSchema>;

const WidgetPreferencesSchema = z.object({
  activeEngine: z.string().optional(),
  preferences: z.record(z.any()).optional(),
});

export type WidgetPreferences = z.infer<typeof WidgetPreferencesSchema>;

export async function saveTableWidgets(
  prefixedId: string,
  data: WidgetDataState
): Promise<void> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = TableWidgetsSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Failed to parse state:", parsed.error);
    throw new Error("Invalid state format");
  }

  const { error } = await supabase
    .from("table_widgets")
    .upsert(
      {
        prefixed_id: prefixedId,
        user_id: user.id,
        widgets: JSON.stringify(parsed.data),
      },
      {
        onConflict: "prefixed_id,user_id",
      }
    )
    .select();

  if (error) {
    console.error("Failed to save widgets:", error);
    throw error;
  } else {
    console.log("Saved widgets");
  }
}

export async function loadTableWidgets(
  prefixedId: string
): Promise<TableWidgets | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("table_widgets")
    .select("widgets")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  if (typeof data.widgets !== "string")
    throw new Error("Invalid widgets format");

  const parsed = TableWidgetsSchema.safeParse(JSON.parse(data.widgets));

  if (!parsed.success) {
    throw new Error("Failed to parse widgets:", parsed.error);
  }

  return parsed.data;
}

export async function saveWidgetPreferences(
  prefixedId: string,
  activeEngine?: string,
  preferences?: Record<string, any>
): Promise<void> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("widget_preferences")
    .upsert(
      {
        prefixed_id: prefixedId,
        user_id: user.id,
        active_engine: activeEngine,
        preferences: preferences || {},
      },
      {
        onConflict: "prefixed_id,user_id",
      }
    )
    .select();

  if (error) {
    console.error("Failed to save widget preferences:", error);
    throw error;
  } else {
    console.log("Saved widget preferences");
  }
}

export async function loadWidgetPreferences(
  prefixedId: string
): Promise<WidgetPreferences | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("widget_preferences")
    .select("active_engine, preferences")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return {
    activeEngine: data.active_engine || undefined,
    preferences:
      typeof data.preferences === "object" && data.preferences !== null
        ? (data.preferences as Record<string, any>)
        : {},
  };
}
