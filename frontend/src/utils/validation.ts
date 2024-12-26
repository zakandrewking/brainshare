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
export function isValidNumber(value: any, type: string): boolean {
  if (value === null || value === undefined || value === "") return false; // Empty values are invalid
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (type === "integer-numbers") {
    return Number.isInteger(num);
  }
  return true; // for decimal-numbers
}

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

  // Filter out empty values and get unique values
  const nonEmptyValues = columnData.filter(
    (value) => value !== null && value !== undefined && value !== ""
  );
  const uniqueValues = new Set(nonEmptyValues);

  // If we have no non-empty values, return 0
  if (nonEmptyValues.length === 0) return 0;

  // Calculate the percentage of values that belong to the most common values
  // We consider it a good enum if there are relatively few unique values
  // compared to the total number of non-empty values
  const uniqueRatio = uniqueValues.size / nonEmptyValues.length;

  // If we have too many unique values relative to the total number of values,
  // it's probably not a good enum
  if (uniqueRatio > 0.5) return 0;

  // Return a percentage based on how well the values fit into an enum pattern
  // The fewer unique values relative to total values, the higher the percentage
  return Math.max(0, (1 - uniqueRatio) * 100);
}
