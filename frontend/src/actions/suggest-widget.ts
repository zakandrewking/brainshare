"use server";

import OpenAI from "openai";
import { z } from "zod";

import { Identification } from "@/stores/identification-store";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SuggestWidgetColumn {
  identification: Identification;
  sampleValues: string[];
}

const widgetSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  vegaLiteSpec: z.record(z.any()),
});

type WidgetSuggestion = z.infer<typeof widgetSuggestionSchema>;

interface SuggestWidgetState {
  error?: string;
  suggestion?: WidgetSuggestion;
}

export async function suggestWidget(
  columns: SuggestWidgetColumn[],
  prevState: SuggestWidgetState
): Promise<SuggestWidgetState> {
  const { user } = await getUser();
  if (!user) return { error: "Not authenticated" };

  if (columns.length > 30) {
    return { error: "Too many columns. Please limit to 30 columns." };
  }

  const prompt = `Given the following dataset columns with their types and sample values,
    suggest a meaningful Vega-Lite visualization specification.

    Columns:
    ${columns
      .map(
        (col) =>
          `${col.identification.name} (${
            col.identification.type
          }): ${col.sampleValues.slice(0, 5).join(", ")}`
      )
      .join("\n")}

    Create a visualization that best represents relationships or patterns in this data.

    The response should be a valid JSON object. It should have the format:

    {
      "name": "...",
      "description": "...",
      "vegaLiteSpec": { ... }
    }

    vegaLiteSpec should be a complete, valid Vega-Lite specification in JSON format.
    `;

  let response: string;
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });
    const res = completion.choices[0]?.message?.content;
    if (!res) throw new Error("No response from OpenAI");
    response = res;
  } catch (error) {
    console.error("Error suggesting widgets:", error);
    return { error: "Failed to generate visualization suggestions" };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(response);
  } catch (error) {
    return { error: "Invalid response format from OpenAI" };
  }

  const parseResult = widgetSuggestionSchema.safeParse(parsed);
  if (!parseResult.success) {
    console.error("Invalid response format:", parseResult.error);
    return { error: "Invalid response format from OpenAI" };
  }

  const suggestion = parseResult.data;

  return {
    suggestion,
  };
}
