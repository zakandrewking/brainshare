import { isValidNumber } from "@/utils/validation";

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm">
      {children}
    </div>
  );
}

export default function MatchesBox({
  type,
  redisData,
  columnData,
}: {
  type: string;
  redisData: { matches: number; total: number };
  columnData: any[];
}) {
  if (redisData?.matches && redisData.matches > 0) {
    return (
      <Box>{`${redisData.matches} of ${redisData.total} values found in Redis`}</Box>
    );
  }

  if (type === "integer-numbers" || type === "decimal-numbers") {
    const validValues = columnData.filter((value) =>
      isValidNumber(value, type)
    );
    return (
      <Box>{`${validValues.length} of ${columnData.length} values are valid ${
        type === "integer-numbers" ? "integers" : "decimals"
      }`}</Box>
    );
  }

  if (type === "enum-values") {
    const nonEmptyValues = columnData.filter(
      (value) => value !== null && value !== undefined && value !== ""
    );
    const uniqueValues = new Set(nonEmptyValues);
    return (
      <Box>{`${uniqueValues.size} unique values across ${nonEmptyValues.length} non-empty values`}</Box>
    );
  }
  return <></>;
}
