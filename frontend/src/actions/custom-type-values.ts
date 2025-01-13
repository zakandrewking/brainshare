"use server";

import Redis from "ioredis";

import { getUser } from "@/utils/supabase/server";

const redis = new Redis(process.env.REDIS_CONNECTION_STRING!);

export async function createTypeValues(typeId: string, values: string[]) {
  const { supabase, user } = await getUser();

  // Get the values key
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (!customType.values_key) {
    throw new Error("No values key found");
  }

  // Store values in Redis
  await redis.sadd(customType.values_key, ...values);
}

export async function readTypeValues(
  typeId: string,
  limit?: number,
  filter?: string
) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (!customType.values_key) {
    throw new Error("No values key found");
  }

  let values: string[];
  if (limit) {
    // iterate on scan
    const allValues = [];
    let cur = "0";
    let iter = 0;
    const lowerFilter = filter?.toLowerCase();

    while (true) {
      const [newCur, val] = await redis.sscan(customType.values_key, cur);

      // Apply filter during scanning if provided
      const filteredBatch = lowerFilter
        ? val.filter((value) => value.toLowerCase().includes(lowerFilter))
        : val;
      allValues.push(...filteredBatch);

      if (allValues.length >= limit || newCur === "0") {
        values = allValues.slice(0, limit);
        break;
      }
      iter += 1;
      if (iter > 500) {
        throw new Error("reached max iter");
      }
      cur = newCur;
    }
  } else {
    // Get values from Redis
    values = await redis.smembers(customType.values_key);
    // Apply filter if provided
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      values = values.filter((value) =>
        value.toLowerCase().includes(lowerFilter)
      );
    }
  }

  return values;
}

export async function addTypeValues(typeId: string, values: string[]) {
  const { supabase, user } = await getUser();

  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (!customType.values_key) {
    throw new Error("No values key found");
  }

  // Add values to Redis
  await redis.sadd(customType.values_key, ...values);
}

export async function deleteTypeValue(typeId: string, value: string) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (!customType.values_key) {
    throw new Error("No values key found");
  }

  // Delete the value from Redis
  await redis.srem(customType.values_key, value);
}

export async function getTypeValuesCount(typeId: string) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (!customType.values_key) {
    throw new Error("No values key found");
  }

  // Get count from Redis
  return await redis.scard(customType.values_key);
}

export async function dropTypeValues(typeId: string) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) {
    console.error("Error getting type", typeError);
    throw typeError;
  }

  if (!customType.values_key) {
    console.error("No values key found");
    throw new Error("No values key found");
  }

  try {
    await redis.del(customType.values_key);
  } catch (e) {
    // want a server-side log
    console.error("Error dropping type values", e);
    throw e;
  }
}
