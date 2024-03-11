// Preview a tab-separated values file

import { memo } from "react";
import * as R from "remeda";

import { Typography } from "@mui/material";
import TableView from "../shared/TableView";

export function parseTsv(
  source: string
): [{ field: string }[], Record<string, string>[]] {
  const data = source.split("\n");
  const header = data[0].split("\t");
  const columns = header.map((h) => ({ field: h }));
  const rows = data.slice(1).map((row) => {
    const cells = row.split("\t");
    const obj = R.zipObj(header, cells);
    return obj;
  });
  return [columns, rows];
}

export const TsvView = memo(function TextContent({
  columns,
  rows,
}: {
  columns: { field: string }[];
  rows: Record<string, string>[];
}) {
  return (
    <>
      <Typography variant="body2" sx={{ mb: "5px" }}>
        Hint: Click a column header name to map it to the graph.
      </Typography>
      <TableView columns={columns} rows={rows} />
    </>
  );
});

export default TsvView;
