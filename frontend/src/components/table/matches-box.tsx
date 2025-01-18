import { type Identification } from "@/stores/identification-store";
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
  redisMatchData,
  columnData,
  min,
  max,
}: {
  identification?: Identification;
  redisMatchData?: { matches: number; total: number };
  columnData: any[];
  min?: number;
  max?: number;
}) {
  if (!identification) return <></>;

  const { type, kind, is_custom } = identification;

  if (is_custom && kind === "enum") {
    if (!redisMatchData) return <></>;
    return (
      <Box>{`${redisMatchData.matches} of ${redisMatchData.total} values match ${type}`}</Box>
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
