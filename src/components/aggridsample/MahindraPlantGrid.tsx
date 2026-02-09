// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { createRoot } from "react-dom/client";
// import { AgGridReact } from "ag-grid-react";

// import type {
//   ColDef,
//   GetRowIdFunc,
//   ICellRendererParams,
//   RowDragEndEvent,
// } from "ag-grid-community";

// import {
//   ModuleRegistry,
//   ClientSideRowModelModule,
//   TextEditorModule,
//   NumberEditorModule,
// } from "ag-grid-community";

// import {
//   RowGroupingModule,
//   ExcelExportModule,
//   MenuModule,
//   ColumnsToolPanelModule,
//   RangeSelectionModule,
//   FormulaModule,
//   ClipboardModule,
// } from "ag-grid-enterprise";

// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   TextEditorModule,
//   NumberEditorModule,
//   ClipboardModule,
//   RowGroupingModule,
//   ExcelExportModule,
//   MenuModule,
//   ColumnsToolPanelModule,
//   RangeSelectionModule,
//   FormulaModule,
// ]);

// const ImageRenderer: React.FC<ICellRendererParams> = (props) => {
//   if (!props.data || !props.data.plant) return null;

//   return (
//     <img
//       src={props.value as string}
//       width={36}
//       height={36}
//       style={{ objectFit: "cover", borderRadius: 4 }}
//       loading="lazy"
//       alt=""
//     />
//   );
// };

// interface PlantRowData {
//   id: number;
//   plant: string | null;
//   path: string[];
//   productionCost: number | null;
//   quantity: number | null;
//   extraCost?: number | null;
//   totalCost?: number | null;
//   image?: string;
//   [key: string]: any;
// }

// const MahindraPlantGrid: React.FC = () => {
//   const gridRef = useRef<AgGridReact<PlantRowData>>(null);
//   const [rowData, setRowData] = useState<PlantRowData[]>([]);

//   const createEmptyCols = () => {
//     const obj: Record<string, null> = {};
//     for (let i = 1; i <= 200; i++) {
//       obj[`col_${i}`] = null;
//     }
//     return obj;
//   };

//   useEffect(() => {
//     fetch("http://localhost:3001/plants")
//       .then(res => res.json())
//       .then((baseData: PlantRowData[]) => {
//         const rows: PlantRowData[] = [];
//         let id = 1;

//         const DATA_ROWS = 3;
//         const TOTAL_ROWS = 1000;

//         for (const base of baseData) {
//           if (rows.length >= DATA_ROWS) break;

//           rows.push({
//             ...base,
//             ...createEmptyCols(),
//             id: id++,
//             path: [],
//             image: import.meta.env.BASE_URL + "src/images/building.jpg",
//           });
//         }

//         while (rows.length < TOTAL_ROWS) {
//           rows.push({
//             id: id++,
//             plant: null,
//             productionCost: null,
//             quantity: null,
//             extraCost: null,
//             totalCost: null,
//             path: [],
//             image: import.meta.env.BASE_URL + "src/images/building.jpg",
//             ...createEmptyCols(),
//           });
//         }

//         setRowData(rows);
//       });
//   }, []);

//   const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
//     const updated: PlantRowData[] = [];
//     event.api.forEachNode((node) => {
//       if (node.data) updated.push(node.data);
//     });
//     setRowData(updated);
//   }, []);

//   const deleteSelectedRows = useCallback(() => {
//     const selectedNodes = gridRef.current?.api.getSelectedNodes() || [];
//     if (!selectedNodes.length) return;

//     const selectedIds = new Set(selectedNodes.map(n => n.data?.id));
//     setRowData(prev => prev.filter(row => !selectedIds.has(row.id)));
//   }, []);

// const insertRowBelowNode = useCallback((node: any) => {
//   if (!node || !node.data) return;

//   const insertIndex = node.rowIndex + 1;

//   const newRow: PlantRowData = {
//     id: Date.now(),
//     plant: null,
//     productionCost: null,
//     quantity: null,
//     extraCost: null,
//     totalCost: null,
//     path: [...(node.data.path || [])], //  auto-copy BOM path
//     image: import.meta.env.BASE_URL + "src/images/building.jpg",
//     ...createEmptyCols(),
//   };

//   setRowData(prev => {
//     const updated = [...prev];
//     updated.splice(insertIndex, 0, newRow);
//     return updated;
//   });

//   // 🔥 FORCE AG GRID TO RECALCULATE ROW INDEX
//   requestAnimationFrame(() => {
//     gridRef.current?.api.refreshClientSideRowModel("everything");
//   });
// }, []);


//   const columnDefs = useMemo<ColDef[]>(() => {
//     const cols: ColDef[] = [
//       {
//         headerName: "",
//         pinned: "left",
//         width: 70,
//         sortable: false,
//         filter: false,
//         editable: false,
//         valueGetter: (params) =>
//           params.node ? params.node.rowIndex! + 1 : "",
//       },
//       {
//         headerName: "Image",
//         field: "image",
//         pinned: "left",
//         width: 80,
//         sortable: false,
//         filter: false,
//         editable: false,
//         cellRenderer: ImageRenderer,
//       },
//       {
//         field: "plant",
//         headerName: "Plant / BOM",
//         pinned: "left",
//         minWidth: 260,
//         rowDrag: true,
//         cellRenderer: "agGroupCellRenderer",
//         editable: true,
//       },
//       {
//         field: "productionCost",
//         headerName: "Production Cost",
//         editable: true,
//         aggFunc: "sum",
//       },
//       {
//         field: "quantity",
//         headerName: "Qty",
//         editable: true,
//         aggFunc: "sum",
//       },
//       {
//         field: "extraCost",
//         headerName: "Extra Cost",
//         editable: true,
//         aggFunc: "sum",
//       },
//     ];

//     for (let i = 1; i <= 200; i++) {
//       if (i === 200) {
//         cols.push({
//           field: "col_200",
//           headerName: "C200 (Formula)",
//           editable: false,
//           valueGetter: (p) => {
//             const productionCost = Number(p.data?.productionCost) || 0;
//             const quantity = Number(p.data?.quantity) || 0;
//             const extraCost = Number(p.data?.extraCost) || 0;
//             return productionCost * quantity + extraCost;
//           },
//           width: 140,
//         });
//       } else {
//         cols.push({
//           field: `col_${i}`,
//           headerName: `C${i}`,
//           editable: true,
//           valueParser: (p) => {
//             const v = Number(p.newValue);
//             return isNaN(v) ? null : v;
//           },
//           width: 120,
//         });
//       }
//     }

//     return cols;
//   }, []);

//   const defaultColDef = useMemo<ColDef>(
//     () => ({
//       editable: true,
//       sortable: true,
//       filter: true,
//       resizable: true,
//       flex: 1,
//     }),
//     []
//   );

//   const getRowId: GetRowIdFunc = useCallback(
//     (p) => String(p.data.id),
//     []
//   );

//   return (
//     <div style={{ width: "100%", height: "100vh" }} className="ag-theme-alpine">

//       {/* ✅ Toolbar Button */}


//       <AgGridReact<PlantRowData>
//         ref={gridRef}
//         rowData={rowData}
//         columnDefs={columnDefs}
//         defaultColDef={defaultColDef}
//         getRowId={getRowId}
//         components={{ ImageRenderer }}

//         rowDragManaged
//         onRowDragEnd={onRowDragEnd}


//         enableCellExpressions
//         valueCache
//         enableRangeSelection
//         enableFillHandle
//         undoRedoCellEditing
//         singleClickEdit

//         treeData
//         getDataPath={(d) => d.path}
//         groupDefaultExpanded={-1}
//         grandTotalRow="bottom"

//         rowSelection="multiple"
//         animateRows
//         sideBar
//         rowHeight={44}

//         getContextMenuItems={(params) => {
//           return [
//             {
//               name: "Insert Row Below",
//               action: () => insertRowBelowNode(params.node),
//             },
//             "separator",
//             "copy",
//             "paste",
//           ];
//         }}


//         onCellKeyDown={(e) => {
//           const k = e.event as KeyboardEvent | null;

//           if (k?.key === "Delete" || k?.key === "Backspace") {
//             deleteSelectedRows();
//           }

//           // if (k?.key === "Enter") {
//           //   const node = e.node;
//           //   if (node) insertRowBelowNode(node);


//           // }
//         }}

//         processCellFromClipboard={(params) => {
//           if (params.value == null || params.value === "") return null;
//           const num = Number(String(params.value).replace(/,/g, ""));
//           return isNaN(num) ? params.value : num;
//         }}
//       />
//     </div>
//   );
// };

// export default MahindraPlantGrid;

// const root = createRoot(document.getElementById("root")!);
// root.render(<MahindraPlantGrid />);







import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";

import type {
  ColDef,
  GetRowIdFunc,
  ICellRendererParams,
  RowDragEndEvent,
} from "ag-grid-community";

import {
  ModuleRegistry,
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
} from "ag-grid-community";

import {
  RowGroupingModule,
  ExcelExportModule,
  MenuModule,
  ColumnsToolPanelModule,
  RangeSelectionModule,
  FormulaModule,
  ClipboardModule,
} from "ag-grid-enterprise";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../../css/mahindra_poc.css"; // 👈 ADD THIS LINE

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  ClipboardModule,
  RowGroupingModule,
  ExcelExportModule,
  MenuModule,
  ColumnsToolPanelModule,
  RangeSelectionModule,
  FormulaModule,
]);

const ImageRenderer: React.FC<ICellRendererParams> = (props) => {
  const src =
    (props.value as string) ||
    import.meta.env.BASE_URL + "src/images/building.jpg";

  return (
    <img
      src={src}
      width={24}
      height={24}
      style={{ objectFit: "cover", borderRadius: 4 }}
      loading="lazy"
      alt=""
    />
  );
};

interface PlantRowData {
  id: number;
  srNo: number;
  plant: string | null;
  path: string[];
  productionCost: number | null;
  quantity: number | null;
  extraCost?: number | null;
  totalCost?: number | null;
  image?: string;
  [key: string]: any;
}

const MahindraPlantGrid: React.FC = () => {
  const gridRef = useRef<AgGridReact<PlantRowData>>(null);
  const [rowData, setRowData] = useState<PlantRowData[]>([]);

  const createEmptyCols = () => {
    const obj: Record<string, null> = {};
    for (let i = 1; i <= 200; i++) {
      obj[`col_${i}`] = null;
    }
    return obj;
  };

  useEffect(() => {
    fetch("http://localhost:3001/plants")
      .then((res) => res.json())
      .then((baseData: PlantRowData[]) => {
        const rows: PlantRowData[] = [];
        let id = 1;

        const DATA_ROWS = 1000;
        const TOTAL_ROWS = 1000;

        for (const base of baseData) {
          if (rows.length >= DATA_ROWS) break;

          rows.push({
            ...base,
            ...createEmptyCols(),
            id,
            srNo: id,
            path: [],
            image: import.meta.env.BASE_URL + "src/images/building.jpg",
          });
          id++;
        }

        while (rows.length < TOTAL_ROWS) {
          rows.push({
            id,
            srNo: id,
            plant: null,
            productionCost: null,
            quantity: null,
            extraCost: null,
            totalCost: null,
            path: [],
            image: import.meta.env.BASE_URL + "src/images/building.jpg",
            ...createEmptyCols(),
          });
          id++;
        }

        setRowData(rows);
      });
  }, []);

  const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
    const updated: PlantRowData[] = [];
    event.api.forEachNode((node) => {
      if (node.data) updated.push(node.data);
    });

    setRowData(
      updated.map((r, i) => ({
        ...r,
        srNo: i + 1,
      }))
    );
  }, []);

  const deleteSelectedRows = useCallback(() => {
    const selectedNodes = gridRef.current?.api.getSelectedNodes() || [];
    if (!selectedNodes.length) return;

    const selectedIds = new Set(selectedNodes.map((n) => n.data?.id));

    setRowData((prev) =>
      prev
        .filter((row) => !selectedIds.has(row.id))
        .map((r, i) => ({ ...r, srNo: i + 1 }))
    );
  }, []);

  const insertRowBelowNode = useCallback((node: any) => {
    if (!node || !node.data) return;

    const insertIndex = node.data.srNo;

    setRowData((prev) => {
      const updated = [...prev];

      updated.splice(insertIndex, 0, {
        id: Date.now(),
        srNo: 0,
        plant: null,
        productionCost: null,
        quantity: null,
        extraCost: null,
        totalCost: null,
        path: [...(node.data.path || [])],
        image: import.meta.env.BASE_URL + "src/images/building.jpg",
        ...createEmptyCols(),
      });

      return updated.map((r, i) => ({
        ...r,
        srNo: i + 1,
      }));
    });
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => {
    const cols: ColDef[] = [
      {
        headerName: "",
        pinned: "left",
        width: 70,
        editable: false,
        sortable: false,
        filter: false,
        valueGetter: (params) =>
          params.node?.rowPinned ? "" : params.data?.srNo ?? "",
      },
      {
        headerName: "Image",
        field: "image",
        pinned: "left",
        width: 80,
        editable: false,
        cellRenderer: ImageRenderer,
      },
      {
        field: "plant",
        headerName: "Plant / BOM",
        pinned: "left",
        minWidth: 260,
        rowDrag: true,
        cellRenderer: "agGroupCellRenderer",
        editable: true,
      },
      { field: "productionCost", headerName: "Production Cost", minWidth: 60, editable: true },
      { field: "quantity", headerName: "Qty", minWidth: 60, editable: true },
      { field: "extraCost", headerName: "Extra Cost", minWidth: 60, editable: true },
    ];

    for (let i = 1; i <= 200; i++) {
      if (i === 200) {
        cols.push({
          field: "col_200",
          headerName: "C200 (Formula)",
          width: 90,
          minWidth: 90,
          // maxWidth: 90,
          suppressSizeToFit: true,
          resizable: true,
          valueGetter: (p) => {
            const pc = Number(p.data?.productionCost) || 0;
            const q = Number(p.data?.quantity) || 0;
            const ec = Number(p.data?.extraCost) || 0;
            return pc * q + ec;
          },
          aggFunc: "sum", //  THIS is what enables grand total
        });

      } else {
        cols.push({
          field: `col_${i}`,
          headerName: `C${i}`,
          editable: true,
          valueParser: (p) => {
            const v = Number(p.newValue);
            return isNaN(v) ? null : v;
          },
          width: 90,
          minWidth: 90,
          // maxWidth: 90,
          suppressSizeToFit: true,
          resizable: true,
        });
      }
    }

    return cols;
  }, []);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    }),
    []
  );

  const getRowId: GetRowIdFunc = useCallback((p) => String(p.data.id), []);

  const processDataFromClipboard = useCallback((params: any) => {
    return params.data;
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }} className="ag-theme-alpine">
      <AgGridReact<PlantRowData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        components={{ ImageRenderer }}
        processDataFromClipboard={processDataFromClipboard}
        rowDragManaged
        onRowDragEnd={onRowDragEnd}
        enableRangeSelection
        undoRedoCellEditing
        singleClickEdit
        treeData
        getDataPath={(d) => d.path}
        groupDefaultExpanded={-1}
        grandTotalRow="bottom"
        rowSelection="multiple"
        animateRows
        sideBar
        rowHeight={44}
        getContextMenuItems={(params) => [
          { name: "Insert Row Below", action: () => insertRowBelowNode(params.node) },
          "separator",
          "copy",
          "paste",
        ]}
        onCellKeyDown={(e) => {
          const k = e.event as KeyboardEvent | null;
          if (k?.key === "Delete" || k?.key === "Backspace") {
            deleteSelectedRows();
          }
        }}
      />
    </div>
  );
};

export default MahindraPlantGrid;

const root = createRoot(document.getElementById("root")!);
root.render(<MahindraPlantGrid />);
