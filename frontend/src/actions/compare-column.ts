"use server";

import { Redis } from "ioredis";

import { getUser } from "@/utils/supabase/server";

const redis = new Redis(process.env.REDIS_CONNECTION_STRING!);

export async function compareColumnWithRedis(
  columnValues: string[],
  typeKey: string
) {
  let setKey: string;
  // For custom types, get the values_key from the database
  const { supabase, user } = await getUser();
  const { data: customType, error } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeKey)
    .eq("user_id", user.id)
    .single();
  if (error) throw error;

  if (!customType.values_key)
    throw new Error("Custom type has no values key set");

  setKey = customType.values_key;

  try {
    // Check all values in a single Redis command
    const membershipResults = await redis.smismember(setKey, columnValues);

    // Split values based on membership results
    const matches: string[] = [];
    const missingInRedis: string[] = [];

    columnValues.forEach((value, index) => {
      if (membershipResults[index]) {
        matches.push(value);
      } else {
        missingInRedis.push(value);
      }
    });

    // For built-in types, get the info. For custom types, we don't have info yet
    let infoJson = {};

    return {
      matches,
      missingInRedis,
      missingInColumn: [], // We can't determine this without loading the full set
      info: infoJson,
    };
  } catch (error) {
    console.error("Redis comparison error:", error);
    throw new Error("Failed to compare with Redis set");
  }
}
