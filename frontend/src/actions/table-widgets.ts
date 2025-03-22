"use server";

import { type WidgetDataState, WidgetEngine } from "@/stores/widget-store";
import { getUser } from "@/utils/supabase/server";

export type TableWidgets = {
  widgets: Array<{
    id?: string;
    engine: WidgetEngine;
    type: string;
    name: string;
    description: string;
    vegaLiteSpec?: Record<string, any>;
    observablePlotCode?: string;
    isSuggested: boolean;
    displayOrder?: number;
  }>;
};

export async function saveTableWidgets(
  prefixedId: string,
  data: WidgetDataState
): Promise<void> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  try {
    // Get all existing widgets for this prefixed ID
    const { data: existingWidgets, error: existingWidgetsError } =
      await supabase
        .from("widget")
        .select("id, widget_id, name")
        .eq("prefixed_id", prefixedId)
        .eq("user_id", user.id);

    if (existingWidgetsError) {
      throw existingWidgetsError;
    }

    // Create lookup maps for existing widgets
    const existingWidgetsByName = new Map(
      (existingWidgets || []).map((widget) => [widget.name, widget.id])
    );
    const existingWidgetsByWidgetId = new Map(
      (existingWidgets || [])
        .filter((w) => w.widget_id)
        .map((widget) => [widget.widget_id, widget.id])
    );

    // Track processed widget IDs to know which ones to delete
    const processedWidgetIds = new Set<number>();

    // Process each widget
    for (const widget of data.widgets) {
      let existingWidgetId: number | undefined;

      // Try to find by widget_id first (if exists), then by name
      if (widget.id && existingWidgetsByWidgetId.has(widget.id)) {
        existingWidgetId = existingWidgetsByWidgetId.get(widget.id);
      } else if (existingWidgetsByName.has(widget.name)) {
        existingWidgetId = existingWidgetsByName.get(widget.name);
      }

      // Create a unique widget_id if it doesn't exist
      const widget_id =
        widget.id ||
        `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insert or update the widget
      const { data: widgetData, error: widgetError } = await supabase
        .from("widget")
        .upsert(
          {
            id: existingWidgetId,
            prefixed_id: prefixedId,
            user_id: user.id,
            widget_id,
            engine: widget.engine,
            type: widget.type,
            name: widget.name,
            description: widget.description,
            is_suggested: widget.isSuggested,
            display_order: widget.displayOrder,
            vega_lite_spec:
              widget.engine === "vega-lite" && widget.vegaLiteSpec
                ? JSON.stringify(widget.vegaLiteSpec)
                : null,
            observable_plot_code:
              widget.engine === "observable-plot"
                ? widget.observablePlotCode
                : null,
          },
          {
            onConflict: existingWidgetId
              ? "id"
              : "prefixed_id,user_id,widget_id",
          }
        )
        .select("id")
        .single();

      if (widgetError) {
        throw widgetError;
      }

      processedWidgetIds.add(widgetData.id);
    }

    // Delete widgets that no longer exist
    const widgetsToDelete = (existingWidgets || [])
      .filter((widget) => !processedWidgetIds.has(widget.id))
      .map((widget) => widget.id);

    if (widgetsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("widget")
        .delete()
        .in("id", widgetsToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    console.log("Saved widgets");
  } catch (error) {
    console.error("Failed to save widgets:", error);
    throw error;
  }
}

export async function loadTableWidgets(
  prefixedId: string
): Promise<Partial<WidgetDataState> | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  try {
    // Get all widgets for this prefixed ID
    const { data: widgets, error: widgetsError } = await supabase
      .from("widget")
      .select(
        "widget_id, engine, type, name, description, is_suggested, display_order, vega_lite_spec, observable_plot_code"
      )
      .eq("prefixed_id", prefixedId)
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (widgetsError) {
      throw widgetsError;
    }

    if (!widgets || widgets.length === 0) {
      return { widgets: [] };
    }

    // Map the data to the expected structure
    const result = {
      widgets: widgets.map((widget) => ({
        id: widget.widget_id || undefined,
        engine: widget.engine as WidgetEngine,
        type: widget.type,
        name: widget.name,
        description: widget.description,
        vegaLiteSpec: widget.vega_lite_spec
          ? (JSON.parse(widget.vega_lite_spec) as Record<string, any>)
          : undefined,
        observablePlotCode: widget.observable_plot_code || undefined,
        isSuggested: widget.is_suggested,
        displayOrder: widget.display_order || undefined,
      })),
    };

    return result;
  } catch (error) {
    console.error("Failed to load widgets:", error);
    throw error;
  }
}

export async function saveWidgetPreferences(
  prefixedId: string,
  activeEngine: string,
  sidebarWidth: number
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
        sidebar_width: sidebarWidth,
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

export async function loadWidgetPreferences(prefixedId: string) {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("widget_preferences")
    .select("active_engine, sidebar_width")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  return {
    activeEngine: data.active_engine,
    sidebarWidth: data.sidebar_width,
  };
}
