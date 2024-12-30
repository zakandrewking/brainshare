"use server";

import Redis from "ioredis";

import { createClient } from "@/utils/supabase/server";

const redis = new Redis(process.env.REDIS_URL!);

export async function createTypeValues(typeId: number, values: string[]) {
  // Get the current user
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("Not authenticated", userError);
    throw new Error("Not authenticated");
  }

  // Get the values key
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  const valuesKey = customType.values_key;
  if (!valuesKey) {
    throw new Error("Custom type values key not found");
  }

  // Store values in Redis
  await redis.sadd(valuesKey, ...values);
}

export async function readTypeValues(typeId: number) {
  // Get the current user
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("Not authenticated", userError);
    throw new Error("Not authenticated");
  }

  // Get the type
  const { data: customType, error: typeError } = await supabase
    .from("custom_type")
    .select("values_key")
    .eq("id", typeId)
    .eq("user_id", user.id)
    .single();
  if (typeError) throw typeError;

  const valuesKey = customType.values_key;
  if (!valuesKey) throw new Error("Custom type values key not found");

  // Get values from Redis
  return await redis.smembers(valuesKey);
}
