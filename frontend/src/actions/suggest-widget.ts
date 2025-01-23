"use server";

import OpenAI from "openai";
import { z } from "zod";

import { Identification } from "@/stores/identification-store";
import { Widget } from "@/stores/widget-store";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const OPENAI_MODEL = "gpt-4o-mini";

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

export async function suggestWidget(
  columns: SuggestWidgetColumn[],
  existingWidgets: Widget[] = []
): Promise<WidgetSuggestion> {
  const { user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  if (columns.length > 30) {
    throw new Error("Too many columns. Please limit to 30 columns.");
  }

  const prompt = `Given the following dataset columns with their types and sample values,
    suggest a meaningful Vega-Lite visualization specification.

    Be creative to provider the most interesting, useful, data-rich, concise, and intuitive visualization.

    Columns:
    ${columns
      .map(
        (col) =>
          `${col.identification.name} (${
            col.identification.type
          }): ${col.sampleValues.slice(0, 5).join(", ")}`
      )
      .join("\n")}

    Existing visualizations:
    ${existingWidgets.map((w) => `- ${w.name}: ${w.description}`).join("\n")}

    Create a visualization that best represents relationships or patterns in this data.
    IMPORTANT: Do not suggest visualizations that are equivalent or very similar to the existing ones listed above.
    Choose a different perspective or relationship to visualize.

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
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
    });
    const res = completion.choices[0]?.message?.content;
    if (!res) throw new Error("No response from OpenAI");
    response = res;
  } catch (error) {
    console.error("Error suggesting widgets:", error);
    throw new Error("Failed to generate visualization suggestions");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(response);
  } catch (error) {
    console.error("Error parsing response:", error);
    throw new Error("Invalid response format from OpenAI");
  }

  const parseResult = widgetSuggestionSchema.safeParse(parsed);
  if (!parseResult.success) {
    console.error("Invalid response format:", parseResult.error);
    throw new Error("Invalid response format from OpenAI");
  }

  const suggestion = parseResult.data;

  return suggestion;
}
