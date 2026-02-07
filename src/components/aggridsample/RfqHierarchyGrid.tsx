import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";

import type {
  ColDef,
  GetRowIdFunc,
  ICellRendererParams,
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

/* ================= IMAGE RENDERER ================= */
const ImageRenderer: React.FC<ICellRendererParams> = (props) => {
  // ✅ SHOW IMAGE ONLY FOR REAL DATA ROWS
  if (!props.data || !props.data.plant) return null;

  return (
    <img
      src={props.value as string}
      width={36}
      height={36}
      style={{ objectFit: "cover", borderRadius: 4 }}
      loading="lazy"
      alt=""
    />
  );
};


interface PlantRowData {
  id: number;
  plant: string | null;
  path: string[];
  productionCost: number | null;
  quantity: number | null;
  totalCost?: number | null;
  image?: string;
  [key: string]: any;
}


const MahindraPlantGrid: React.FC = () => {
  const gridRef = useRef<AgGridReact<PlantRowData>>(null);
  const [rowData, setRowData] = useState<PlantRowData[]>([]);

 
  useEffect(() => {
    fetch("http://localhost:3001/plants")
      .then(res => res.json())
      .then((baseData: PlantRowData[]) => {
        const rows: PlantRowData[] = [];
        let id = 1;

        const DATA_ROWS = 3;
        const TOTAL_ROWS = 1000;

        const createEmptyCols = () => {
          const obj: Record<string, null> = {};
          for (let i = 1; i <= 200; i++) {
            obj[`col_${i}`] = null;
          }
          return obj;
        };

        for (const base of baseData) {
          if (rows.length >= DATA_ROWS) break;

          rows.push({
            ...base,
            ...createEmptyCols(),
            id: id++,
            path: [],
            image: import.meta.env.BASE_URL + "src/images/building.jpg",
          });
        }

        while (rows.length < TOTAL_ROWS) {
          rows.push({
            id: id++,
            plant: null,
            productionCost: null,
            quantity: null,
            totalCost: null,
            path: [],
            image: import.meta.env.BASE_URL + "src/images/building.jpg",
            ...createEmptyCols(),
          });
        }

        setRowData(rows);
      });
  }, []);


  const columnDefs = useMemo<ColDef[]>(() => {
    const cols: ColDef[] = [
      {
        headerName: "",
        pinned: "left",
        width: 70,
        sortable: false,
        filter: false,
        editable: false,
        valueGetter: (params) =>
          params.node ? params.node.rowIndex! + 1 : "",
      },

      // ✅ IMAGE COLUMN (UNCHANGED)
      {
        headerName: "Image",
        field: "image",
        pinned: "left",
        width: 80,
        sortable: false,
        filter: false,
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
        cellEditor: "agTextCellEditor",
      },
      {
        field: "productionCost",
        headerName: "Production Cost",
        editable: true,
        cellEditor: "agNumberCellEditor",
        aggFunc: "sum",
      },
      {
        field: "quantity",
        headerName: "Qty",
        editable: true,
        cellEditor: "agNumberCellEditor",
        aggFunc: "sum",
      },
      {
        field: "totalCost",
        headerName: "Total Cost (Formula)",
        allowFormula: true,
        editable: true,
        valueGetter: "=productionCost * quantity",
        aggFunc: "sum",
      },
    ];

    for (let i = 1; i <= 200; i++) {
      if (i === 200) {
        cols.push({
          field: "col_200",
          headerName: "C200 (Formula)",
          allowFormula: true,
          editable: true,
          valueGetter: "=(col_1 * col_2) + col_3",
          width: 140,
        });
      } else {
        cols.push({
          field: `col_${i}`,
          headerName: `C${i}`,
          editable: true,
          cellEditor: "agNumberCellEditor",
          width: 120,
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

  const getRowId: GetRowIdFunc = useCallback(
    (p) => String(p.data.id),
    []
  );

  return (
    <div style={{ width: "100%", height: "100vh" }} className="ag-theme-alpine">
      <AgGridReact<PlantRowData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}

        components={{ ImageRenderer }}

        enableCellExpressions
        valueCache

        enableRangeSelection
        enableFillHandle
        undoRedoCellEditing
        singleClickEdit

        suppressClipboardPaste={false}

        processCellFromClipboard={(params) => {
          if (params.value == null || params.value === "") return null;
          const num = Number(String(params.value).replace(/,/g, ""));
          return isNaN(num) ? params.value : num;
        }}

        treeData
        getDataPath={(d) => d.path}
        groupDefaultExpanded={-1}

        grandTotalRow="bottom"

        animateRows
        rowSelection="multiple"
        sideBar
        rowHeight={44}
      />
    </div>
  );
};

export default MahindraPlantGrid;


const root = createRoot(document.getElementById("root")!);
root.render(<MahindraPlantGrid />);
