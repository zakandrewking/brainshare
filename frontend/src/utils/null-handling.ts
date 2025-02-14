type NullToUndefined<T> = T extends null
  ? undefined
  : T extends unknown[]
  ? NullToUndefined<T[number]>[]
  : T extends object
  ? { [K in keyof T]: NullToUndefined<T[K]> }
  : T extends unknown
  ? any
  : T;

/**
 * Recursively converts all null values to undefined and unknown types to any
 * @param value - The value to convert
 * @param maxDepth - Maximum recursion depth (default: 3)
 * @returns A new object/array with all null values converted to undefined and unknown types converted to any
 * @example
 * const data = { name: "John", age: null, metadata: unknown };
 * const result = nullToUndefined(data);
 * // result: { name: "John", age: undefined, metadata: any }
 */
export function nullToUndefined<T>(
  value: T,
  maxDepth: number = 3
): NullToUndefined<T> {
  if (maxDepth < 0) {
    return value as NullToUndefined<T>;
  }

  if (value === null) {
    return undefined as NullToUndefined<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      nullToUndefined(item, maxDepth - 1)
    ) as NullToUndefined<T>;
  }

  if (typeof value === "object") {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = nullToUndefined(val, maxDepth - 1);
    }
    return result;
  }

  return value as NullToUndefined<T>;
}

/**
 * Type guard to check if a value is null or undefined
 * @param value - The value to check
 * @returns True if the value is null or undefined
 */
export function isNullOrUndefined<T>(
  value: T | null | undefined
): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 * @param value - The value to check
 * @returns True if the value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
