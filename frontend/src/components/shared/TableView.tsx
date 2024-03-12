/**
 * A table view component using ag-grid.
 *
 * This component triesd to use the full height of the parent container, so the
 * parent needs to have a height set. The easiest way is:
 *
 * <Container sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }} >
 *
 * Known AG-Grid issues: https://github.com/ag-grid/ag-grid/issues/2634
 *
 * TODO remember column info (order, width)
 * https://stackoverflow.com/questions/51488241/ag-grid-how-to-save-and-reload-column-order
 *
 * TODO remember scroll location
 * https://stackoverflow.com/questions/55723337/ag-grid-how-to-scroll-to-last-known-position
 */

// TODO use code splitting to pull out ag grid
// https://create-react-app.dev/docs/code-splitting/
// https://legacy.reactjs.org/docs/code-splitting.html#route-based-code-splitting
// this might be a good time to replace create-react-app with vite
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";

import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { IHeaderParams, ModuleRegistry } from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { Box } from "@mui/material";

// initialize ag-grid
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export interface ICustomHeaderParams extends IHeaderParams {
  menuIcon: string;
}

export default function TableView({
  columns,
  rows,
}: {
  columns: { field: string }[];
  rows: Record<string, string>[];
}) {
  // const defaultColDef = useMemo(() => {
  //   return {
  //     headerComponentParams: {
  //       template: headerTemplate,
  //     },
  //   };
  // }, []);

  // const [mappedCols, setMappedCols] = useState<number[]>([1]);
  // const [isMappingOpen, setIsMappingOpen] = useState(false);

  // https://codesandbox.io/p/sandbox/aggridtemplate-u4yz8?file=%2Fsrc%2FGrid.tsx%3A83%2C26
  return (
    <Box
      sx={{ flexGrow: 1, minHeight: "300px", width: "100%", mb: "5px" }}
      className="ag-theme-quartz-auto-dark"
    >
      {/* no siblings or the height will be incorrect */}
      <AgGridReact
        rowSelection="multiple"
        columnDefs={columns}
        rowData={rows}
        suppressFieldDotNotation
        // defaultColDef={defaultColDef}
        alwaysShowHorizontalScroll
        alwaysShowVerticalScroll
        // components={components}
      />
    </Box>
    //    <ColumnMappingDialog
    //     isOpen={isMappingOpen}
    //     setIsOpen={setIsMappingOpen} />
  );
}

// function ColumnMappingDialog({
//   isOpen,
//   setIsOpen,
// }: {
//   isOpen: boolean;
//   setIsOpen: (isOpen: boolean) => void;
// }) {
//   const theme = useTheme();
//   const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

//   return (
//     <Dialog
//       fullScreen={fullScreen}
//       open={isOpen}
//       onClose={() => setIsOpen(false)}
//     >
//       <DialogTitle>Use Google's location service?</DialogTitle>
//       <DialogContent>
//         <DialogContentText>
//           Let Google help apps determine location. This means sending anonymous
//           location data to Google, even when no apps are running.
//         </DialogContentText>
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={() => setIsOpen(false)} autoFocus>
//           Done
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

// function CustomHeader({
//   showColumnMenu,
//   column,
//   setSort,
//   menuIcon,
//   displayName,
// }: ICustomHeaderParams) {
//   const [ascSort, setAscSort] = useState("inactive");
//   const [descSort, setDescSort] = useState("inactive");
//   const [noSort, setNoSort] = useState("inactive");
//   const refButton = useRef(null);

//   const enableSorting = true;
//   const enableMenu = false;

//   const onMenuClicked = () => {
//     if (refButton.current) {
//       showColumnMenu(refButton.current);
//     }
//   };

//   const onSortRequested = (order: any, event: any) => {
//     setSort(order, event.shiftKey);
//   };

//   useEffect(() => {
//     const onSortChanged = () => {
//       setAscSort(column.isSortAscending() ? "active" : "inactive");
//       setDescSort(column.isSortDescending() ? "active" : "inactive");
//       setNoSort(
//         !column.isSortAscending() && !column.isSortDescending()
//           ? "active"
//           : "inactive"
//       );
//     };
//     column.addEventListener("sortChanged", onSortChanged);
//     return () => column.removeEventListener("sortChanged", onSortChanged);
//   }, [column]);

//   let sort = null;
//   if (enableSorting) {
//     sort = (
//       <Stack direction="row" alignItems="center" gap={0}>
//         <IconButton onClick={(event) => onSortRequested("asc", event)}>
//           <SouthRoundedIcon fontSize="small" />
//         </IconButton>
//         <IconButton onClick={(event) => onSortRequested("desc", event)}>
//           <NorthRoundedIcon fontSize="small" />
//         </IconButton>
//       </Stack>
//     );
//   }

//   return (
//     <Stack
//       width="100%"
//       direction="row"
//       alignItems="center"
//       justifyContent="space-between"
//     >
//       <Button>{displayName}</Button>
//       {sort}
//     </Stack>
//   );
// }
