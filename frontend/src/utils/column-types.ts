interface SharedTypeDefinition {
  name: string;
  description: string;
  examples?: string[];
  not_examples?: string[];
  rules?: string[];
}

export interface ColumnTypeDefinition extends SharedTypeDefinition {
  is_custom: false;
}

export interface CustomTypeDefinition extends SharedTypeDefinition {
  is_custom: true;
  id: string;
  name: string;
  kind: string;
  min_value?: number;
  max_value?: number;
  log_scale?: boolean;
}

export type TypeDefinition = ColumnTypeDefinition | CustomTypeDefinition;

export const COLUMN_TYPES: ColumnTypeDefinition[] = [
  {
    name: "enum-values",
    description: "A categorical value from a finite set of possible values",
    examples: ["small", "medium", "large", "A", "B", "C", "low", "high"],
    rules: [
      "must be a categorical value from a finite set of possible values",
      "values should be consistent across the column",
      "missing values are allowed",
    ],
  },
  {
    name: "decimal-numbers",
    description: "A decimal number",
    examples: ["1.0", "1.1", "1.2", "1.3", "1.4"],
    rules: [
      "must be a decimal number",
      "must have exactly one or zero decimal point and no other non-numeric characters",
      "missing values are allowed",
    ],
  },
  {
    name: "integer-numbers",
    description: "A whole integer number",
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
    description: "A boolean value",
    examples: ["true", "false", "TRUE", "FALSE", "True", "False", "y", "n"],
    rules: [
      "must be a boolean value",
      "must be either true or false",
      "missing values are allowed",
    ],
  },
  {
    name: "date-values",
    description: "A date value",
    examples: ["2024-03-14", "2023-12-25", "2022-01-01"],
    not_examples: [
      "03/14/2024",
      "25-12-2023",
      "2022.01.01",
      "2024-03-14T12:00:00Z",
    ],
    rules: [
      "must be a valid date in ISO format (YYYY-MM-DD)",
      "must not include time values",
      "missing values are allowed",
    ],
  },
  {
    name: "time-values",
    description: "A time value (without date)",
    examples: ["13:45:00", "23:59:59", "00:00:00", "1:45 PM", "23:59"],
    rules: [
      "must not include date values or timezone information",
      "missing values are allowed",
    ],
  },
].map((x) => ({
  ...x,
  is_custom: false,
}));

export const ACCEPTABLE_TYPES = COLUMN_TYPES.map((type) => type.name);

export function generateTypePrompt(customTypes: CustomTypeDefinition[]) {
  const allTypes = [...COLUMN_TYPES, ...customTypes];

  const typesYaml = allTypes
    .map((type) => {
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

      if (type.is_custom) {
        lines.push(`  kind: ${type.kind}`);
        if (type.min_value !== undefined)
          lines.push(`  min_value: ${type.min_value}`);
        if (type.max_value !== undefined)
          lines.push(`  max_value: ${type.max_value}`);
        if (type.log_scale !== undefined)
          lines.push(`  log_scale: ${type.log_scale}`);
      }

      return lines.join("\n");
    })
    .join("\n");

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
