"use server";

import OpenAI from "openai";
import { z } from "zod";

import { Identification } from "@/stores/identification-store";
import { Widget } from "@/stores/widget-store";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const OPENAI_MODEL_O1 = "o1-mini"; // works a lot better with o1-preview; but saving $$$
const OPENAI_MODEL_STRUCTURED = "gpt-4o-mini";

const datasetDescription =
  "This dataset contains the latitude, longitude, population, and country for every city in the world.";

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
    or y-axis or in the legend.

    7. The response should be a valid JSON object. It should have the format:

    {
      "name": "...",
      "description": "...",
      "vegaLiteSpec": { ... }
    }

    IT IS VERY IMPORTANT THAT THE RESPONSE IS A ONLY VALID JSON OBJECT.

    # Dataset Description

    ${datasetDescription}

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

  console.log(
    `🤖 Step 1: Querying ${OPENAI_MODEL_O1} for visualization suggestion...`
  );
  console.log("Prompt:", prompt);

  let o1Response: string;
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: OPENAI_MODEL_O1,
    });
    const res = completion.choices[0]?.message?.content;
    if (!res) throw new Error(`No response from OpenAI ${OPENAI_MODEL_O1}`);
    o1Response = res;
    console.log("✅ o1-preview response received:", o1Response);
  } catch (error) {
    console.error(`❌ Error getting ${OPENAI_MODEL_O1} response:`, error);
    throw new Error(
      `Failed to generate visualization suggestion with ${OPENAI_MODEL_O1}`
    );
  }

  console.log(
    `🤖 Step 2: Processing with ${OPENAI_MODEL_STRUCTURED} for structured output...`
  );

  try {
    const structuredResponse = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Given the following data, format it as a valid JSON object with the following structure:
          {
            "name": string,
            "description": string,
            "vegaLiteSpec": object
          }

          Here is the data to format: ${o1Response}`,
        },
      ],
      model: OPENAI_MODEL_STRUCTURED,
      response_format: { type: "json_object" },
    });

    const res = structuredResponse.choices[0]?.message?.content;
    if (!res) {
      throw new Error(`No structured response from ${OPENAI_MODEL_STRUCTURED}`);
    }

    const parsed = JSON.parse(res);
    const parseResult = widgetSuggestionSchema.safeParse(parsed);
    if (!parseResult.success) {
      throw new Error(
        `Invalid response format from ${OPENAI_MODEL_STRUCTURED}`
      );
    }

    console.log("✅ Final structured suggestion:", parseResult.data);
    return parseResult.data;
  } catch (error) {
    console.error("❌ Error processing structured output:", error);
    throw new Error(
      `Failed to process structured output with ${OPENAI_MODEL_STRUCTURED}`
    );
  }
}
