"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ColumnIdentification {
  type: string;
  confidence: number;
  description: string;
  suggestedActions?: string[];
}

export async function identifyColumn(
  columnName: string,
  sampleValues: string[],
): Promise<ColumnIdentification> {
  try {
    const prompt = `Analyze this column of data:
Column name: ${columnName}
Sample values: ${sampleValues.join(", ")}

Please identify the type of data in this column and provide:
1. The most likely data type (e.g., "protein_id", "gene_name", "numeric_measurement", etc.). Be sure to return from the list of known data types below with the exact name from KNOWN_DATA_TYPES.
2. A confidence score between 0 and 1
3. A brief description of what this column represents

Format your response in JSON like this:
{
  "type": "data_type",
  "confidence": 0.95,
  "description": "Brief description",
}

# KNOWN_DATA_TYPES
- name: pdb-ids examples: 1AKE, 1AKG, 1AKH, 1AKI, 1AKJ

`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(response) as ColumnIdentification;
  } catch (error) {
    console.error("Error identifying column:", error);
    return {
      type: "unknown",
      confidence: 0,
      description: "Failed to identify column type",
      suggestedActions: [],
    };
  }
}
