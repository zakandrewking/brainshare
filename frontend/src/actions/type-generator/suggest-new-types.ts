"use server";

import OpenAI from "openai";

import { TypeDefinition } from "@/utils/column-types";
import { getUser } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TypeSuggestion {
  type: string;
  description: string;
  sampleValues: string[];
  kind: "decimal" | "integer" | "enum";
  needsMinMax?: boolean;
  needsLogScale?: boolean;
}

export async function suggestNewTypes(existingTypes: TypeDefinition[]) {
  const { user } = await getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const prompt = `Suggest a column type that might be found in a scientific data file.

Please analyze the description and identify potential data types that would be useful for scientists working with this kind of data.
Format your response as a JSON array of objects with the following structure:

{
  "type": "name-of-column",
  "description": "description-of-column",
  "sampleValues": ["example1", "example2", "example3"],
  "kind": "enum" | "decimal" | "integer",
  "needsMinMax": boolean (only for numeric types),
  "needsLogScale": boolean (only for numeric types)
}

For example, if neither of the following types already exist in the database, you might suggest:

{
  "type": "pdb-id",
  "description": "The PDB ID of the protein structure",
  "sampleValues": ["1AKE", "1AKG", "1AKH"],
  "kind": "enum"
}

OR

{
  "type": "resolution-angstroms",
  "description": "The resolution of the protein structure in angstroms",
  "sampleValues": ["1.5", "2.3", "3.0"],
  "kind": "decimal",
  "needsMinMax": true,
  "needsLogScale": false
}

Focus on suggesting specific, well-defined types that would be useful for data validation and analysis.

Do not include any of the following, because they already exist in the database:

${existingTypes.map((t) => `- ${t.name}: ${t.description}`).join("\n")}
`;

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

    const suggestions = JSON.parse(response) as TypeSuggestion;
    return suggestions;
  } catch (error) {
    console.error("Error getting type suggestions:", error);
    throw error;
  }
}
