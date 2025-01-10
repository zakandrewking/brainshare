interface SharedTypeDefinition {
  name: string;
  description?: string;
  examples?: string[];
  not_examples?: string[];
  rules?: string[];
}

export interface ColumnTypeDefinition extends SharedTypeDefinition {
  is_custom: false;
}

export interface CustomTypeDefinition extends SharedTypeDefinition {
  is_custom: true;
  id: number;
}

export const COLUMN_TYPES: ColumnTypeDefinition[] = [
  {
    name: "enum-values",
    examples: ["small", "medium", "large", "A", "B", "C", "low", "high"],
    rules: [
      "must be a categorical value from a finite set of possible values",
      "values should be consistent across the column",
      "missing values are allowed",
    ],
  },
  {
    name: "decimal-numbers",
    examples: ["1.0", "1.1", "1.2", "1.3", "1.4"],
    rules: [
      "must be a decimal number",
      "must have exactly one or zero decimal point and no other non-numeric characters",
      "missing values are allowed",
    ],
  },
  {
    name: "integer-numbers",
    examples: ["1", "2", "3", "4", "5"],
    not_examples: ["1.0", "1_1"],
    rules: [
      "must be a whole integer number, not a decimal number",
      "must not include a decimal point or any non-numeric characters",
      "missing values are allowed",
    ],
  },
  {
    name: "boolean-values",
    examples: ["true", "false", "TRUE", "FALSE", "True", "False", "y", "n"],
    rules: [
      "must be a boolean value",
      "must be either true or false",
      "missing values are allowed",
    ],
  },
].map((x) => ({
  ...x,
  is_custom: false,
}));

export const ACCEPTABLE_TYPES = COLUMN_TYPES.map((type) => type.name);

export function generateTypePrompt(): string {
  const typesYaml = COLUMN_TYPES.map((type) => {
    const lines = [`- name: ${type.name}`];
    if (type.examples) {
      lines.push(`  examples: [${type.examples.join(", ")}]`);
    }

    if (type.not_examples) {
      lines.push(`  not_examples: [${type.not_examples.join(", ")}]`);
    }

    if (type.rules) {
      lines.push("  rules:");
      type.rules.forEach((rule) => {
        lines.push(`    - ${rule}`);
      });
    }

    return lines.join("\n");
  }).join("\n");

  return `Please identify the type of data in this column and provide:

1. A data type "name" from the data types below labeled "Known Data Types".
   The data MUST match the "examples" pattern and MUST NOT match the
   "not_examples" pattern and MUST follow all of the "rules" provided to be
   considered a match. Carefully consider ALL of the Sample Values before
   making a decision.
2. A brief description of what this column represents

If there is any doubt, return "unknown-type" for the type, with a description
of your reasoning.

Format your response in JSON like this:

{
  "type": "data_type_name",
  "description": "Brief description",
}

# Known Data Types

${typesYaml}`;
}
