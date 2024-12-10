"use server";

import OpenAI from "openai";

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

Please identify the type of data in this column and provide:

1. A data type "name" from the data types below labeled "Known Data Types".
   The data MUST match the "examples" pattern and MUST NOT match the
   "not_examples" pattern and MUST follow all of the "rules" provided to be
   considered a match. Carefully consider ALL of the Sample Values before
   making a decision.
2. A brief description of what this column represents

If there is any doubt, return "unknown" for the type, with a description
of your reasoning.

Format your response in JSON like this:

{
  "type": "data_type_name",
  "description": "Brief description",
}

# Known Data Types

- name: pdb-ids
  examples: [1AKE, 1AKG, 1AKH, 1AKI, 1AKJ]
- name: decimal-numbers
  examples: [1.0, 1.1, 1.2, 1.3, 1.4]
  rules:
    - must be a decimal number
    - must have exactly one or zero decimal point and no other non-numeric characters
    - missing values are allowed
- name: integer-numbers
  examples: [1, 2, 3, 4, 5]
  not_examples: [1.0, 1_1]
  rules:
    - must be a whole integer number, not a decimal number
    - must not include a decimal point or any non-numeric characters
    - missing values are allowed
- name: boolean-values
  examples: [true, false, TRUE, FALSE, True, False, y, n]
  rules:
    - must be a boolean value
    - must be either true or false
    - missing values are allowed
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
      description: "Failed to identify column type",
      suggestedActions: [],
    };
  }
}
