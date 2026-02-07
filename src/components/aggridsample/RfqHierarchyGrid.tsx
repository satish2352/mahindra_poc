import React, { useCallback, useMemo, useRef, useState } from "react";
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
}

/* ================= DATA ================= */
const generateRows = (): PlantRowData[] => {
  const rows: PlantRowData[] = [];
  let id = 1;

  for (let p = 1; p <= 10; p++) {
    const plant = `Plant ${p}`;

    rows.push({
      id: id++,
      plant,
      path: [plant],
      productionCost: 0,
      quantity: 1,
    });

    for (let d = 1; d <= 3; d++) {
      const dept = `Department ${d}`;

      rows.push({
        id: id++,
        plant: dept,
        path: [plant, dept],
        productionCost: 100,
        quantity: 2,
      });

      rows.push({
        id: id++,
        plant: "Raw Material",
        path: [plant, dept, "Raw Material"],
        productionCost: 50,
        quantity: 3,
      });
    }
  }
  return rows;
};

/* ================= COMPONENT ================= */
const MahindraPlantGrid: React.FC = () => {
  const gridRef = useRef<AgGridReact<PlantRowData>>(null);
  const [rowData] = useState(generateRows());

  /* ================= COLUMNS ================= */
  const columnDefs = useMemo<ColDef[]>(() => [
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
      field: "totalCost",                     // 🔥 REQUIRED
      headerName: "Total Cost (Formula)",
      allowFormula: true,
      valueGetter: "=productionCost * quantity",
      aggFunc: "sum",
    },
  ], []);

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

        /* 🔥 REQUIRED FOR FORMULAS */
        enableCellExpressions={true}
        valueCache={true}

        /* Excel-like editing */
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        enableRangeSelection
        enableFillHandle
        undoRedoCellEditing

        /* Tree / BOM */
        treeData
        getDataPath={(d) => d.path}
        groupDefaultExpanded={-1}

        /* Grand total */
        grandTotalRow="bottom"

        /* UI */
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
