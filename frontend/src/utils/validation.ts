// Helper function to check if a value is a valid enum value
export function isValidEnumValue(value: any, columnData: any[]): boolean {
  return false;

  // TODO way slow

  if (value === null || value === undefined || value === "") return false;

  // Count occurrences of each value
  const valueCounts = new Map<string, number>();
  columnData.forEach((v) => {
    if (v === null || v === undefined || v === "") return;
    valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
  });

  // Get total non-empty values
  const totalValues = Array.from(valueCounts.values()).reduce(
    (a, b) => a + b,
    0
  );

  // A value is considered a valid enum value if it appears multiple times
  // or makes up a significant portion of the values
  const count = valueCounts.get(value) || 0;
  return count > 1 || count / totalValues > 0.1;
}

// Helper function to check if a value is a valid number
export function isValidNumber(
  value: any,
  type: string,
  min?: number,
  max?: number
): boolean {
  if (value === null || value === undefined || value === "") return false; // Empty values are invalid
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  if (type === "integer-numbers") {
    return Number.isInteger(num);
  }
  return true;
}
35676000;

// Helper function to check if a value is a valid boolean
export function isValidBoolean(value: any): boolean {
  if (value === null || value === undefined || value === "") return false; // Empty values are invalid
  const lowerValue = value.toString().toLowerCase();
  return ["true", "false", "t", "f", "y", "n", "1", "0"].includes(lowerValue);
}

// Helper function to calculate percentage of valid numeric values in a column
export function calculateNumericPercentage(
  columnData: any[],
  type: string
): number {
  if (!columnData.length) return 0;
  const validValues = columnData.filter((value) => isValidNumber(value, type));
  return (validValues.length / columnData.length) * 100;
}

// Helper function to calculate percentage of valid enum values in a column
export function calculateEnumPercentage(columnData: any[]): number {
  if (!columnData.length) return 0;

  // Count non-empty values
  const nonEmptyValues = columnData.filter(
    (value) => value !== null && value !== undefined && value !== ""
  );

  // Return percentage of non-empty values
  return (nonEmptyValues.length / columnData.length) * 100;
}

// Helper function to calculate percentage of valid boolean values in a column
export function calculateBooleanPercentage(columnData: any[]): number {
  if (!columnData.length) return 0;
  const validValues = columnData.filter((value) => isValidBoolean(value));
  return (validValues.length / columnData.length) * 100;
}
