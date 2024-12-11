"use server";

import OpenAI from "openai";

import { generateTypePrompt } from "@/lib/column-types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ColumnIdentification {
  type: string;
  description: string;
  suggestedActions?: string[];
}

export async function identifyColumn(
  columnName: string,
  sampleValues: string[]
): Promise<ColumnIdentification> {
  try {
    const prompt = `Analyze this column of data:
Column Name: ${columnName}
Sample Values: ${sampleValues.join(", ")}

${generateTypePrompt()}`;

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
      description: "Failed to identify column type",
      suggestedActions: [],
    };
  }
}
