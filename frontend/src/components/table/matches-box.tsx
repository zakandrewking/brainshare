import { Identification } from "@/stores/table-store";
import {
  getUniqueNonNullValues,
  isValidBoolean,
  isValidNumber,
} from "@/utils/validation";

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
      {children}
    </div>
  );
}

export default function MatchesBox({
  identification,
  redisData,
  columnData,
  min,
  max,
}: {
  identification?: Identification;
  redisData?: { matches: number; total: number };
  columnData: any[];
  min?: number;
  max?: number;
}) {
  if (!identification) return <></>;

  const { type, kind, is_custom } = identification;

  if (is_custom && kind === "enum") {
    if (!redisData) return <></>;
    return (
      <Box>{`${redisData.matches} of ${redisData.total} values match ${type}`}</Box>
    );
  }

  if (type === "integer-numbers" || type === "decimal-numbers") {
    const validValues = columnData.filter((value) =>
      isValidNumber(value, type, min, max)
    );
    const rangeText =
      min !== undefined || max !== undefined
        ? ` (${min !== undefined ? `min: ${min}` : ""}${
            min !== undefined && max !== undefined ? ", " : ""
          }${max !== undefined ? `max: ${max}` : ""})`
        : "";
    return (
      <Box>{`${validValues.length} of ${columnData.length} values are valid ${
        type === "integer-numbers" ? "integers" : "decimals"
      }${rangeText}`}</Box>
    );
  }

  if (type === "enum-values") {
    const uniqueValues = getUniqueNonNullValues(columnData);
    return (
      <Box>{`${uniqueValues.length} unique values across ${columnData.length} values`}</Box>
    );
  }

  if (type === "boolean-values") {
    const validValues = columnData.filter((value) => isValidBoolean(value));
    return (
      <Box>{`${validValues.length} of ${columnData.length} values are valid booleans`}</Box>
    );
  }

  return <></>;
}
