"use server";

import OpenAI from "openai";
import { z } from "zod";

import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const customTypeSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  rules: z.array(z.string()),
  examples: z.array(z.string()),
  not_examples: z.array(z.string()),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  log_scale: z.boolean().optional(),
});

type CustomTypeSuggestion = z.infer<typeof customTypeSuggestionSchema>;

interface NumericOptions {
  needsMinMax: boolean;
  needsLogScale: boolean;
  kind: "decimal" | "integer";
}

export async function suggestCustomType(
  columnName: string,
  sampleValues: string[],
  numericOptions: NumericOptions | null,
  prevState: { error?: string; suggestion?: CustomTypeSuggestion }
): Promise<{ error?: string; suggestion?: CustomTypeSuggestion }> {
  const { user, supabase } = await getUser();
  if (!user) return { error: "Not authenticated" };

  let prompt = `Given a column of data, suggest a custom type definition.

Column Name: ${columnName}
Sample Values: ${sampleValues.join(", ")}

Please provide:
1. A name for this type (in kebab-case, e.g., protein-sequences)
2. A clear description of what this type represents
3. A list of validation rules that values of this type should follow
4. A list of valid example values that match these rules
5. A list of invalid example values that don't match these rules`;

  if (numericOptions) {
    prompt += `\n\nThis is a ${numericOptions.kind} type.`;
    if (numericOptions.needsMinMax) {
      prompt += `\nPlease also suggest appropriate minimum and maximum values for this data.`;
    }
    if (numericOptions.needsLogScale) {
      prompt += `\nPlease also suggest whether a logarithmic scale would be appropriate for this data (true/false).`;
    }
  }

  prompt += `\n\nFormat your response as a JSON object with the following structure:
{
  "name": "type-name",
  "description": "Description of the type",
  "rules": ["rule 1", "rule 2", ...],
  "examples": ["example1", "example2", ...],
  "not_examples": ["invalid1", "invalid2", ...]${
    numericOptions
      ? `,
  ${
    numericOptions.needsMinMax
      ? `"min_value": number,
  "max_value": number,`
      : ""
  }
  ${numericOptions.needsLogScale ? `"log_scale": boolean,` : ""}`
      : ""
  }
}`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const parseResult = customTypeSuggestionSchema.safeParse(
      JSON.parse(response)
    );
    if (!parseResult.success) {
      console.error("Invalid response format:", parseResult.error);
      throw new Error("Invalid response format from OpenAI");
    }

    const suggestion = parseResult.data;

    // Get a unique name for the suggestion
    const { data: uniqueName, error: uniqueNameError } = await supabase.rpc(
      "get_unique_custom_type_name",
      {
        suggested_name: suggestion.name,
        user_id_param: user.id,
      }
    );

    if (uniqueNameError) {
      console.error("Error getting unique name:", uniqueNameError);
      throw uniqueNameError;
    }

    // Update the suggestion with the unique name
    suggestion.name = uniqueName;

    return { suggestion };
  } catch (error) {
    console.error("Error getting custom type suggestions:", error);
    return { error: "Error getting custom type suggestions" };
  }
}
