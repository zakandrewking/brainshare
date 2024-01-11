import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { GridReadyEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useState } from "react";
import * as R from "remeda";

import { Box } from "@mui/material";

export default function TsvView({ source }: { source: string }) {
  return (
    <>
      <TextContent source={source} />
    </>
  );
}

export interface Athlete {
  id: number;
  athlete: string;
  age: number;
  country: string;
  sport: string;
  bronze: number;
  silver: number;
  gold: number;
  total: number;
  date: string;
  year: number;
}

const TextContent = memo(function TextContent({ source }: { source: string }) {
  const data = source.split("\n");
  const header = data[0].split("\t");
  const columns = header.map((h) => ({ field: h }));
  const rows = data.slice(1).map((row) => {
    const cells = row.split("\t");
    const obj = R.zipObj(header, cells);
    console.log(obj);
    return obj;
  });
  console.log(header);
  console.log(rows);

  // https://codesandbox.io/p/sandbox/aggridtemplate-u4yz8?file=%2Fsrc%2FGrid.tsx%3A83%2C26
  return (
    <Box
      sx={{ flexGrow: 1, minHeight: "300px", width: "100%", mb: "5px" }}
      className="ag-theme-quartz-auto-dark"
    >
      <AgGridReact
        // weird typing error, but it works if we provide this onGridReady
        onGridReady={(params: GridReadyEvent) => {}}
        columnDefs={columns}
        rowData={rows}
        suppressFieldDotNotation
      />
    </Box>
  );
});
