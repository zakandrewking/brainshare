export function detectHeaderRow(rows: string[][]): boolean {
  if (rows.length < 2) return false;

  const firstRow = rows[0];
  const secondRow = rows[1];

  if (!firstRow || !secondRow) return false;

  // Strategy 1: Check if first row has different data types than subsequent rows
  const firstRowNumericCount = firstRow.filter(
    (cell) => cell.length != 0 && !isNaN(Number(cell))
  ).length;
  const secondRowNumericCount = secondRow.filter(
    (cell) => cell.length != 0 && !isNaN(Number(cell))
  ).length;

  // If first row has significantly fewer numbers than second row, it's likely a header
  if (firstRowNumericCount === 0 && secondRowNumericCount > 0) {
    return true;
  }

  // Strategy 2: Check if first row is shorter in length than other cells
  const firstRowAvgLength =
    firstRow?.reduce((sum, cell) => sum + cell.length, 0) / firstRow.length;
  const secondRowAvgLength =
    secondRow?.reduce((sum, cell) => sum + cell.length, 0) / secondRow.length;

  if (firstRowAvgLength < secondRowAvgLength * 0.5) {
    return true;
  }

  return false;
}

// export function applyEdits(
//   parsedData: string[][],
//   filteredData: string[][],
//   edits: Edit[]
// ) {
//   const newParsedData = parsedData.map((row) => row.slice());
//   const newFilteredData = filteredData.map((row) => row.slice());

//   for (const edit of edits) {
//     if (edit.edit === "deleteRow" || edit.edit === "deleteColumn") {
//       if (
//         typeof edit.row === "number" &&
//         typeof edit.column === "number" &&
//         newParsedData[edit.row] &&
//         newFilteredData[edit.row]
//       ) {
//         newParsedData[edit.row]![edit.column] = "";
//         newFilteredData[edit.row]![edit.column] = "";
//       }
//     }
//   }

//   return { parsedData: newParsedData, filteredData: newFilteredData };
// }
