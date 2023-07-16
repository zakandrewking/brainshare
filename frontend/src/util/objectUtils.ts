/**
 * This handles types better than the lodash equivalent
 */
export function objectMap<T, U>(
  obj: { [key: string]: T },
  fn: (x: T, k?: string, i?: number) => U
): { [key: string]: U } {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)])
  );
}
