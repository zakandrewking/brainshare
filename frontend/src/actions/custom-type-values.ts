"use server";

import Redis from "ioredis";

import { getUser } from "@/utils/supabase/server";

const redis = new Redis(process.env.REDIS_CONNECTION_STRING!);

export async function createTypeValues(typeId: number, values: string[]) {
  const { supabase, user } = await getUser();

  // Get the values key
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  // Store values in Redis
  await redis.sadd(customType.values_key, ...values);
}

export async function readTypeValues(typeId: number, limit?: number) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  if (limit) {
    // iterate on scan
    const allValues = [];
    let cur = "0";
    let iter = 0;
    while (true) {
      const [newCur, val] = await redis.sscan(customType.values_key, cur);
      allValues.push(...val);
      if (allValues.length >= limit || newCur === "0") {
        return allValues.slice(0, limit);
      }
      iter += 1;
      if (iter > 500) {
        throw new Error("reached max iter");
      }
      cur = newCur;
    }
  }

  // Get values from Redis
  return await redis.smembers(customType.values_key);
}

export async function addTypeValues(typeId: number, values: string[]) {
  const { supabase, user } = await getUser();

  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  // Add values to Redis
  await redis.sadd(customType.values_key, ...values);
}

export async function deleteTypeValue(typeId: number, value: string) {
  const { supabase, user } = await getUser();

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  // Delete the value from Redis
  await redis.srem(customType.values_key, value);
}
