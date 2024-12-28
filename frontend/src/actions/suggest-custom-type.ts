"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface CustomTypeSuggestion {
  name: string;
  description: string;
  rules: string[];
  examples: string[];
  not_examples: string[];
}

export async function suggestCustomType(
  columnName: string,
  sampleValues: string[]
): Promise<CustomTypeSuggestion> {
  try {
    const prompt = `Given a column of data, suggest a custom type definition.

Column Name: ${columnName}
Sample Values: ${sampleValues.join(", ")}

Please provide:
1. A name for this type (in kebab-case, e.g., protein-sequences)
2. A clear description of what this type represents
3. A list of validation rules that values of this type should follow
4. A list of valid example values that match these rules
5. A list of invalid example values that don't match these rules

Format your response as a JSON object with the following structure:
{
  "name": "type-name",
  "description": "Description of the type",
  "rules": ["rule 1", "rule 2", ...],
  "examples": ["example1", "example2", ...],
  "not_examples": ["invalid1", "invalid2", ...]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(response) as CustomTypeSuggestion;
  } catch (error) {
    console.error("Error getting custom type suggestions:", error);
    throw error;
  }
}
