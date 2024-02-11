// Preview a tab-separated values file
//
// Known AG-Grid issues:
// https://github.com/ag-grid/ag-grid/issues/2634

import SouthRoundedIcon from "@mui/icons-material/SouthRounded";
import NorthRoundedIcon from "@mui/icons-material/NorthRounded";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { IHeaderParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as R from "remeda";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export interface ICustomHeaderParams extends IHeaderParams {
  menuIcon: string;
}

export default function TsvView({
  source,
  uniqueId,
}: {
  source: string;
  uniqueId: string;
}) {
  return (
    <>
      <TextContent source={source} uniqueId={uniqueId} />
    </>
  );
}

const TextContent = memo(function TextContent({
  uniqueId,
  source,
}: {
  uniqueId: string;
  source: string;
}) {
  const defaultColDef = useMemo(() => {
    return {
      // headerComponentParams: {
      //   template: headerTemplate,
      // },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mappedCols, setMappedCols] = useState<number[]>([1]);
  const [isMappingOpen, setIsMappingOpen] = useState(false);

  const [columns, rows] = useMemo(() => {
    const data = source.split("\n");
    const header = data[0].split("\t");
    const columns = header.map((h, i) => ({
      field: h,
      // ...(mappedCols.indexOf(i) > -1
      //   ? { headerComponentParams: { template: headerTemplateMapped } }
      //   : {}),
    }));
    const rows = data.slice(1).map((row) => {
      const cells = row.split("\t");
      const obj = R.zipObj(header, cells);
      return obj;
    });
    return [columns, rows];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const components = useMemo(() => {
    return {
      // TODO use this for Table but not for Preview
      // agColumnHeader: CustomHeader,
    };
  }, []);

  // https://codesandbox.io/p/sandbox/aggridtemplate-u4yz8?file=%2Fsrc%2FGrid.tsx%3A83%2C26
  return (
    <>
      <Box
        sx={{ flexGrow: 1, minHeight: "300px", width: "100%", mb: "5px" }}
        className="ag-theme-quartz-auto-dark"
      >
        <Typography variant="body2" sx={{ mb: "5px" }}>
          Hint: Click a column header name to map it to the graph.
        </Typography>
        <AgGridReact
          rowSelection="multiple"
          columnDefs={columns}
          rowData={rows}
          suppressFieldDotNotation
          defaultColDef={defaultColDef}
          alwaysShowHorizontalScroll
          alwaysShowVerticalScroll
          components={components}
        />
      </Box>
      <ColumnMappingDialog
        isOpen={isMappingOpen}
        setIsOpen={setIsMappingOpen}
      />
    </>
  );
});

function ColumnMappingDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={isOpen}
      onClose={() => setIsOpen(false)}
    >
      <DialogTitle>Use Google's location service?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Let Google help apps determine location. This means sending anonymous
          location data to Google, even when no apps are running.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsOpen(false)} autoFocus>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CustomHeader({
  showColumnMenu,
  column,
  setSort,
  menuIcon,
  displayName,
}: ICustomHeaderParams) {
  const [ascSort, setAscSort] = useState("inactive");
  const [descSort, setDescSort] = useState("inactive");
  const [noSort, setNoSort] = useState("inactive");
  const refButton = useRef(null);

  const enableSorting = true;
  const enableMenu = false;

  const onMenuClicked = () => {
    if (refButton.current) {
      showColumnMenu(refButton.current);
    }
  };

  const onSortChanged = () => {
    setAscSort(column.isSortAscending() ? "active" : "inactive");
    setDescSort(column.isSortDescending() ? "active" : "inactive");
    setNoSort(
      !column.isSortAscending() && !column.isSortDescending()
        ? "active"
        : "inactive"
    );
  };

  const onSortRequested = (order: any, event: any) => {
    setSort(order, event.shiftKey);
  };

  useEffect(() => {
    column.addEventListener("sortChanged", onSortChanged);
    onSortChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let sort = null;
  if (enableSorting) {
    sort = (
      <Stack direction="row" alignItems="center" gap={0}>
        <IconButton onClick={(event) => onSortRequested("asc", event)}>
          <SouthRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={(event) => onSortRequested("desc", event)}>
          <NorthRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    );
  }

  return (
    <Stack
      width="100%"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Button>{displayName}</Button>
      {sort}
    </Stack>
  );
}
