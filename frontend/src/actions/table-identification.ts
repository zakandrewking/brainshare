"use server";

import {
  type Identification,
  type IdentificationDataState,
  type RedisInfo,
  type RedisStatus,
  type Stats,
  type TypeOptions,
} from "@/stores/identification-store";
import { getUser } from "@/utils/supabase/server";

export async function saveTableIdentifications(
  prefixedId: string,
  data: IdentificationDataState
) {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  try {
    // First, find or create the table_identification record
    const { data: tableData, error: tableError } = await supabase
      .from("table_identification")
      .upsert(
        {
          prefixed_id: prefixedId,
          user_id: user.id,
          has_header: data.hasHeader,
        },
        {
          onConflict: "prefixed_id,user_id",
        }
      )
      .select("id")
      .single();

    if (tableError) {
      throw tableError;
    }

    const tableId = tableData.id;

    // Save identifications
    for (const [columnIndexStr, identification] of Object.entries(
      data.identifications
    )) {
      const columnIndex = parseInt(columnIndexStr, 10);

      // Insert column identification
      const { data: colIdData, error: colIdError } = await supabase
        .from("column_identification")
        .upsert(
          {
            table_identification_id: tableId,
            column_index: columnIndex,
            type: identification.type,
            description: identification.description,
            is_custom: identification.is_custom,
            external_id: identification.id || null,
            external_name: identification.name || null,
            external_kind: identification.kind || null,
            min_value: identification.min_value ?? null,
            max_value: identification.max_value ?? null,
            log_scale: identification.log_scale ?? null,
          },
          {
            onConflict: "table_identification_id,column_index",
          }
        )
        .select("id")
        .single();

      if (colIdError) {
        throw colIdError;
      }

      // Handle suggested actions if present
      if (identification.suggestedActions?.length) {
        // First delete existing actions
        const { error: deleteSuggestedError } = await supabase
          .from("column_suggested_action")
          .delete()
          .eq("column_identification_id", colIdData.id);

        if (deleteSuggestedError) {
          throw deleteSuggestedError;
        }

        // Insert new actions
        for (const action of identification.suggestedActions) {
          const { error: actionError } = await supabase
            .from("column_suggested_action")
            .insert({
              column_identification_id: colIdData.id,
              action: action,
            });

          if (actionError) {
            throw actionError;
          }
        }
      }
    }

    // Save stats
    for (const [columnIndexStr, statData] of Object.entries(data.stats)) {
      const columnIndex = parseInt(columnIndexStr, 10);
      const stats = statData as Stats;

      const { error: statsError } = await supabase.from("column_stats").upsert(
        {
          table_identification_id: tableId,
          column_index: columnIndex,
          min_value: stats.min ?? null,
          max_value: stats.max ?? null,
        },
        {
          onConflict: "table_identification_id,column_index",
        }
      );

      if (statsError) {
        throw statsError;
      }
    }

    // Save type options
    for (const [columnIndexStr, optionData] of Object.entries(
      data.typeOptions
    )) {
      const columnIndex = parseInt(columnIndexStr, 10);
      const options = optionData;

      const { error: optionsError } = await supabase
        .from("column_type_options")
        .upsert(
          {
            table_identification_id: tableId,
            column_index: columnIndex,
            min_value: options.min ?? null,
            max_value: options.max ?? null,
            logarithmic: options.logarithmic,
          },
          {
            onConflict: "table_identification_id,column_index",
          }
        );

      if (optionsError) {
        throw optionsError;
      }
    }

    // Save Redis data
    for (const [columnIndexStr, statusValue] of Object.entries(
      data.redisStatus
    )) {
      const columnIndex = parseInt(columnIndexStr, 10);
      const status = statusValue as RedisStatus;
      const redisMatchData = data.redisMatchData as Record<
        string,
        { matches: number; total: number }
      >;
      const matchData = redisMatchData[columnIndexStr];

      // Insert Redis data
      const { data: redisData, error: redisError } = await supabase
        .from("column_redis_data")
        .upsert(
          {
            table_identification_id: tableId,
            column_index: columnIndex,
            status,
            matches_count: matchData?.matches ?? null,
            total_count: matchData?.total ?? null,
          },
          {
            onConflict: "table_identification_id,column_index",
          }
        )
        .select("id")
        .single();

      if (redisError) {
        throw redisError;
      }

      // Save Redis matches
      const redisMatches = data.redisMatches as Record<
        string,
        string[] | undefined
      >;
      const matches = redisMatches[columnIndexStr] || [];
      if (matches?.length) {
        // First delete existing matches
        const { error: deleteMatchesError } = await supabase
          .from("column_redis_match")
          .delete()
          .eq("column_redis_data_id", redisData.id);

        if (deleteMatchesError) {
          throw deleteMatchesError;
        }

        // Insert new matches
        for (const match of matches) {
          const { error: matchError } = await supabase
            .from("column_redis_match")
            .insert({
              column_redis_data_id: redisData.id,
              match_value: match,
            });

          if (matchError) {
            throw matchError;
          }
        }
      }

      // Save Redis info
      const redisInfo = data.redisInfo as Record<string, RedisInfo | undefined>;
      const info = redisInfo[columnIndexStr];
      if (info) {
        const { error: infoError } = await supabase
          .from("column_redis_info")
          .upsert(
            {
              column_redis_data_id: redisData.id,
              link_prefix: info.link_prefix || null,
              description: info.description || null,
              num_entries: info.num_entries || null,
              link: info.link || null,
            },
            {
              onConflict: "column_redis_data_id",
            }
          );

        if (infoError) {
          throw infoError;
        }
      }
    }

    // Save filters
    // First delete existing filters
    const { error: deleteFiltersError } = await supabase
      .from("column_filters")
      .delete()
      .eq("table_identification_id", tableId);

    if (deleteFiltersError) {
      throw deleteFiltersError;
    }

    // Insert new filters
    for (const filter of data.activeFilters) {
      const { error: filterError } = await supabase
        .from("column_filters")
        .insert({
          table_identification_id: tableId,
          column_index: filter.column,
          filter_type: filter.type,
        });

      if (filterError) {
        throw filterError;
      }
    }

    console.log("Saved identifications");
  } catch (error) {
    console.error("Failed to save identifications:", error);
    throw error;
  }
}

export async function loadTableIdentifications(
  prefixedId: string
): Promise<Partial<IdentificationDataState> | null> {
  const { user, supabase } = await getUser();
  if (!user) throw new Error("Not authenticated");

  // Query the table_identification record
  const { data: tableData, error: tableError } = await supabase
    .from("table_identification")
    .select("id, has_header")
    .eq("prefixed_id", prefixedId)
    .eq("user_id", user.id)
    .single();

  if (tableError) {
    if (tableError.code === "PGRST116") return null; // Not found
    throw tableError;
  }

  // Initialize the result structure
  const newIdentifications: Record<string, Identification> = {};
  const newStats: Record<string, Stats> = {};
  const newTypeOptions: Record<string, TypeOptions> = {};
  const newRedisStatus: Record<string, RedisStatus> = {};
  const newRedisMatchData: Record<string, { matches: number; total: number }> =
    {};
  const newRedisMatches: Record<string, string[]> = {};
  const newRedisInfo: Record<string, RedisInfo> = {};

  // Load column identifications
  const { data: colIdentifications, error: colIdError } = await supabase
    .from("column_identification")
    .select(
      "id, column_index, type, description, is_custom, external_id, external_name, external_kind, min_value, max_value, log_scale"
    )
    .eq("table_identification_id", tableData.id);

  if (colIdError) throw colIdError;

  // Process column identifications
  for (const col of colIdentifications || []) {
    // Load suggested actions for this column
    const { data: suggestedActions, error: suggestedActionsError } =
      await supabase
        .from("column_suggested_action")
        .select("action")
        .eq("column_identification_id", col.id);

    if (suggestedActionsError) throw suggestedActionsError;

    // Build identification object
    newIdentifications[col.column_index.toString()] = {
      type: col.type,
      description: col.description,
      is_custom: col.is_custom,
      name: col.external_name || undefined,
      kind: col.external_kind || undefined,
      min_value: col.min_value || undefined,
      max_value: col.max_value || undefined,
      log_scale: col.log_scale || undefined,
      suggestedActions: suggestedActions?.map((sa) => sa.action),
    };
  }

  // Load column stats
  const { data: colStats, error: colStatsError } = await supabase
    .from("column_stats")
    .select("column_index, min_value, max_value")
    .eq("table_identification_id", tableData.id);

  if (colStatsError) throw colStatsError;

  // Process column stats
  for (const stat of colStats || []) {
    newStats[stat.column_index.toString()] = {
      min:
        stat.min_value !== null
          ? Number(stat.min_value)
          : (null as unknown as number),
      max:
        stat.max_value !== null
          ? Number(stat.max_value)
          : (null as unknown as number),
    };
  }

  // Load type options
  const { data: typeOptions, error: typeOptionsError } = await supabase
    .from("column_type_options")
    .select("column_index, min_value, max_value, logarithmic")
    .eq("table_identification_id", tableData.id);

  if (typeOptionsError) throw typeOptionsError;

  // Process type options
  for (const option of typeOptions || []) {
    newTypeOptions[option.column_index.toString()] = {
      min:
        option.min_value !== null
          ? Number(option.min_value)
          : (null as unknown as number),
      max:
        option.max_value !== null
          ? Number(option.max_value)
          : (null as unknown as number),
      logarithmic: option.logarithmic,
    };
  }

  // Load Redis data
  const { data: redisData, error: redisDataError } = await supabase
    .from("column_redis_data")
    .select("id, column_index, status, matches_count, total_count")
    .eq("table_identification_id", tableData.id);

  if (redisDataError) throw redisDataError;

  // Process Redis data
  for (const redis of redisData || []) {
    const columnKey = redis.column_index.toString();

    // Set Redis status
    if (redis.status) {
      newRedisStatus[columnKey] = redis.status as RedisStatus;
    }

    // Set match data if available
    if (redis.matches_count !== null && redis.total_count !== null) {
      newRedisMatchData[columnKey] = {
        matches: redis.matches_count,
        total: redis.total_count,
      };
    }

    // Load Redis matches
    const newRedisMatches: Record<string, string[] | undefined> = {};
    const { data: matches, error: matchesError } = await supabase
      .from("column_redis_match")
      .select("match_value")
      .eq("column_redis_data_id", redis.id);

    if (matchesError) throw matchesError;

    if (matches?.length) {
      newRedisMatches[columnKey] = matches.map((m) => m.match_value);
    }

    // Load Redis info
    const newRedisInfo: Record<string, RedisInfo | undefined> = {};

    const { data: info, error: infoError } = await supabase
      .from("column_redis_info")
      .select("link_prefix, description, num_entries, link")
      .eq("column_redis_data_id", redis.id)
      .maybeSingle();

    if (infoError) throw infoError;

    if (info) {
      newRedisInfo[columnKey] = {
        link_prefix: info.link_prefix || "",
        description: info.description || "",
        num_entries: info.num_entries || 0,
        link: info.link || "",
      };
    }
  }

  // Load active filters
  const { data: filters, error: filtersError } = await supabase
    .from("column_filters")
    .select("column_index, filter_type")
    .eq("table_identification_id", tableData.id);

  if (filtersError) throw filtersError;

  // Process filters
  const newActiveFilters =
    filters?.map((filter) => ({
      column: filter.column_index,
      type: filter.filter_type as "valid-only" | "invalid-only",
    })) || [];

  console.log("Loaded identifications");

  return {
    identifications: newIdentifications,
    stats: newStats,
    typeOptions: newTypeOptions,
    redisStatus: newRedisStatus,
    redisMatchData: newRedisMatchData,
    redisMatches: newRedisMatches,
    redisInfo: newRedisInfo,
    activeFilters: newActiveFilters,
  };
}
