"use server";

import OpenAI from "openai";
import { z } from "zod";

import { Identification } from "@/stores/identification-store";
import { Widget } from "@/stores/widget-store";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const OPENAI_MODEL = "gpt-4o";

export interface SuggestWidgetColumn {
  fieldName: string;
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
  existingWidgets: Widget[],
  dataSize: number
): Promise<WidgetSuggestion> {
  const { user } = await getUser();
  if (!user) throw new Error("Not authenticated");

  if (columns.length > 30) {
    throw new Error("Too many columns. Please limit to 30 columns.");
  }

  const prompt = `Given the following dataset columns with their types and sample
    values, suggest a meaningful Vega-Lite visualization specification.

    # Rules

    1. Be creative to provider the most interesting, useful, data-rich, concise, and
    intuitive visualization. It's OK to provide a targeted visualization of a particular
    aspect of the data -- assume that multiple visualizations will be created. For example,
    a histogram of a particular column is OK.

    2. Do not suggest visualizations that are equivalent or very similar to the
    existing ones listed in the Existing Visualizations section. Choose a different
    perspective or relationship to visualize.

    3. The field names in the Vega-Lite spec must match exactly the fieldNames in the
    Columns section.

    4. The vegaLiteSpec should be a valid Vega-Lite specification in JSON format.

    5. Each column will have ${dataSize} values. Be sure that the visualization
    can render in a reasonable amount of time for this data size, and that the visual
    elements will not overlap or becomes unreadable.

    6. The default width of the visualization will be 500px and the height
    will be 300px. Be sure that the visualization is not too complex for this
    size. For example, do not try to include more than ~ 40 labels on the x-axis
    or y-axis.

    7. The response should be a valid JSON object. It should have the format:

    {
      "name": "...",
      "description": "...",
      "vegaLiteSpec": { ... }
    }

    IT IS VERY IMPORTANT THAT THE RESPONSE IS A ONLY VALID JSON OBJECT.

    # Columns

    ${JSON.stringify(columns, null, 2)}

    # Existing Visualizations

    ${JSON.stringify(
      existingWidgets.map((w) => ({
        name: w.name,
        description: w.description,
      })),
      null,
      2
    )}

    `;

  console.log(prompt);

  let response: string;
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: OPENAI_MODEL,
      response_format: { type: "json_object" }, // does not work with o1-preview
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

  console.log(suggestion);

  return suggestion;
}
