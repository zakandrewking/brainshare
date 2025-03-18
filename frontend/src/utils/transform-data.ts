import { Identification } from "@/stores/identification-store";

/**
 * Transforms string array data into an array of objects using headers and type identifications
 * @param rawData - 2D array of string data
 * @param headers - Column headers
 * @param identifications - Type identifications for columns
 * @returns Array of objects with header keys and typed values
 */
export function transformDataToValues(
  rawData: string[][],
  headers: string[],
  identifications?: Record<number, Identification>
): Record<string, string | number>[] {
  return rawData.map((row) =>
    Object.fromEntries(
      row
        .map((value, i) => {
          const header = headers[i];
          if (!header) return undefined;
          const identification = identifications?.[i];
          if (!identification) return [header, value];
          if (
            identification?.type === "decimal-numbers" ||
            identification?.type === "integer-numbers" ||
            identification?.kind === "decimal" ||
            identification?.kind === "integer"
          ) {
            return [header, parseFloat(value)];
          }
          return [header, value];
        })
        .filter((pair): pair is [string, string | number] => pair !== undefined)
    )
  );
}
