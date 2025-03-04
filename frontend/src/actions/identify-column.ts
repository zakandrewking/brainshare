/**
 * NOTE react server actions don't have abort signals, but supabase might adopt
 * these for edge functions at some
 * point https://github.com/orgs/supabase/discussions/17715
 *
 * That would be really nice for long-running LLM requests.
 */

"use server";

import OpenAI from "openai";
import { z } from "zod";

import { Identification } from "@/stores/identification-store";
import { generateTypePrompt } from "@/utils/column-types";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const identificationResponseSchema = z.object({
  type: z.string(),
  description: z.string(),
  suggestedActions: z.array(z.string()).optional(),
});

export async function identifyColumn(
  columnName: string,
  sampleValues: string[]
): Promise<Identification> {
  try {
    const { supabase, user } = await getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch custom types if user is authenticated
    const { data: customTypesData, error: customTypesError } = await supabase
      .from("custom_type")
      .select("*")
      .or(`user_id.eq.${user.id},public.is.true`);
    if (customTypesError) {
      console.error("Failed to fetch custom types:", customTypesError);
      throw customTypesError;
    }
    const customTypes =
      customTypesData?.map((type) => ({
        ...type,
        is_custom: true as const,
      })) || [];

    const prompt = `Analyze this column of data:
Column Name: ${columnName}
Sample Values: ${sampleValues.join(", ")}

${generateTypePrompt(customTypes)}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const parseResult = identificationResponseSchema.safeParse(
      JSON.parse(response)
    );
    if (!parseResult.success) {
      console.error("Invalid response format:", parseResult.error);
      throw new Error("Invalid response format from OpenAI");
    }

    const res = parseResult.data;
    const customMatch = customTypes.find((type) => type.name === res.type);
    if (customMatch) {
      return {
        ...res,
        ...customMatch,
      };
    }
    return {
      ...res,
      is_custom: false,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("Error identifying column:", error);
    return {
      type: "unknown-type",
      description: "Failed to identify column type",
      suggestedActions: [],
      is_custom: false,
    };
  }
}
