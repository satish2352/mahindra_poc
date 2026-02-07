import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";

import type { ColDef, GetRowIdFunc } from "ag-grid-community";

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
} from "ag-grid-enterprise";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

/* ================= MODULE REGISTRATION ================= */
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  RowGroupingModule,
  ExcelExportModule,
  MenuModule,
  ColumnsToolPanelModule,
  RangeSelectionModule,
  FormulaModule,
]);

/* ================= TYPES ================= */
interface PlantRowData {
  id: number;
  plant: string;
  path: string[];
  productionCost: number;
  quantity: number;
  totalCost?: number;
  [key: string]: any;
}

/* ================= COMPONENT ================= */
const MahindraPlantGrid: React.FC = () => {
  const gridRef = useRef<AgGridReact<PlantRowData>>(null);
  const [rowData, setRowData] = useState<PlantRowData[]>([]);

  /* ================= LOAD FROM db.json ================= */
  useEffect(() => {
    fetch("http://localhost:3001/plants")
      .then(res => res.json())
      .then((baseData: PlantRowData[]) => {
        const rows: PlantRowData[] = [];
        let id = 1;

        while (rows.length < 1000) {
          for (const base of baseData) {
            if (rows.length >= 1000) break;

            rows.push({
              ...base,
              id: id++,
              col_1: null,
              col_2: null,
              col_3: null,
            });
          }
        }

        setRowData(rows);
      });
  }, []);

  /* ================= COLUMNS ================= */
  const columnDefs = useMemo<ColDef[]>(() => {
    const cols: ColDef[] = [

      /* ✅ EXCEL-LIKE ROW NUMBERING (ONLY ADDITION) */
      {
        headerName: "",
        pinned: "left",
        width: 70,
        // suppressMenu: true,
        sortable: false,
        filter: false,
        editable: false,
        valueGetter: (params) =>
          params.node ? params.node.rowIndex! + 1 : "",
      },

      {
        field: "plant",
        headerName: "Plant / BOM",
        pinned: "left",
        editable: false,
        minWidth: 260,
        rowDrag: true,
        cellRenderer: "agGroupCellRenderer",
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
          editable: false,
          valueGetter: "=(col_1 * col_2) + col_3",
          width: 140,
        });
      } else {
        cols.push({
          field: `col_${i}`,
          headerName: `C${i}`,
          editable: i <= 3,
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

        enableCellExpressions
        valueCache

        singleClickEdit
        stopEditingWhenCellsLoseFocus
        enableRangeSelection
        enableFillHandle
        undoRedoCellEditing

        treeData
        getDataPath={(d) => d.path}
        groupDefaultExpanded={-1}

        grandTotalRow="bottom"

        animateRows
        rowSelection="multiple"
        sideBar
      />
    </div>
  );
};

export default MahindraPlantGrid;

/* ================= RENDER ================= */
const root = createRoot(document.getElementById("root")!);
root.render(<MahindraPlantGrid />);
