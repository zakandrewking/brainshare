"use server";

import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_CONNECTION_STRING!);

export async function compareColumnWithRedis(
  columnValues: string[],
  setKey: string,
) {
  const hardcodedSetKey = `br-resource-${setKey}`;
  try {
    // Check all values in a single Redis command
    const membershipResults = await redis.smismember(hardcodedSetKey, columnValues);

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

    // get info about the set
    const info = await redis.get(`br-resource-info-${setKey}`);
    const infoJson = JSON.parse(info ?? "{}");

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
