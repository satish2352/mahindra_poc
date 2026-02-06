import React, { useCallback, useMemo, useState} from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GetRowIdFunc } from "ag-grid-community";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  NumberEditorModule,
  TextEditorModule,
  ValidationModule,
} from "ag-grid-community";
import { FormulaModule } from "ag-grid-enterprise";

// AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  FormulaModule,
  NumberEditorModule,
  TextEditorModule,
  ValidationModule,
]);

// ---------------- TYPES ----------------
interface PlantRowData {
  id: number;
  plant: string;
  productionCost: number;
  quantity: number;
  subtotal: string; 
  tax: string;      
  total: string;    
}


const valueFormatter = (params: { value: any }) => {
  const val = Number(params.value);
  return isNaN(val) ? params.value : `₹ ${val.toFixed(2)}`;
};


const MahindraPlantGrid: React.FC = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100vh" }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

  const [rowData] = useState<PlantRowData[]>([
    {
      id: 1,
      plant: "Pune",
      productionCost: 125000,
      quantity: 4,
      subtotal: '=REF(COLUMN("productionCost"),ROW(1))*REF(COLUMN("quantity"),ROW(1))',
      tax: '=REF(COLUMN("subtotal"),ROW(1))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(1))+REF(COLUMN("tax"),ROW(1))',
    },
    {
      id: 2,
      plant: "Mumbai",
      productionCost: 98000,
      quantity: 6,
      subtotal: '=REF(COLUMN("productionCost"),ROW(2))*REF(COLUMN("quantity"),ROW(2))',
      tax: '=REF(COLUMN("subtotal"),ROW(2))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(2))+REF(COLUMN("tax"),ROW(2))',
    },
    {
      id: 3,
      plant: "Nagpur",
      productionCost: 76000,
      quantity: 10,
      subtotal: '=REF(COLUMN("productionCost"),ROW(3))*REF(COLUMN("quantity"),ROW(3))',
      tax: '=REF(COLUMN("subtotal"),ROW(3))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(3))+REF(COLUMN("tax"),ROW(3))',
    },
    {
      id: 4,
      plant: "Chennai",
      productionCost: 210000,
      quantity: 3,
      subtotal: '=REF(COLUMN("productionCost"),ROW(4))*REF(COLUMN("quantity"),ROW(4))',
      tax: '=REF(COLUMN("subtotal"),ROW(4))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(4))+REF(COLUMN("tax"),ROW(4))',
    },
    {
      id: 5,
      plant: "Delhi",
      productionCost: 150000,
      quantity: 2,
      subtotal: '=REF(COLUMN("productionCost"),ROW(5))*REF(COLUMN("quantity"),ROW(5))',
      tax: '=REF(COLUMN("subtotal"),ROW(5))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(5))+REF(COLUMN("tax"),ROW(5))',
    },
    {
      id: 6,
      plant: "Hyderabad",
      productionCost: 100000,
      quantity: 3,
      subtotal: '=REF(COLUMN("productionCost"),ROW(6))*REF(COLUMN("quantity"),ROW(6))',
      tax: '=REF(COLUMN("subtotal"),ROW(6))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(6))+REF(COLUMN("tax"),ROW(6))',
    },
    {
      id: 7,
      plant: "Kolkata",
      productionCost: 245000,
      quantity: 1,
      subtotal: '=REF(COLUMN("productionCost"),ROW(7))*REF(COLUMN("quantity"),ROW(7))',
      tax: '=REF(COLUMN("subtotal"),ROW(7))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(7))+REF(COLUMN("tax"),ROW(7))',
    },
    {
      id: 8,
      plant: "Bengaluru",
      productionCost: 180000,
      quantity: 4,
      subtotal: '=REF(COLUMN("productionCost"),ROW(8))*REF(COLUMN("quantity"),ROW(8))',
      tax: '=REF(COLUMN("subtotal"),ROW(8))*0.18',
      total: '=REF(COLUMN("subtotal"),ROW(8))+REF(COLUMN("tax"),ROW(8))',
    },
  ]);

  const getRowId: GetRowIdFunc = useCallback((params) => String(params.data.id), []);

  const [columnDefs] = useState<ColDef<PlantRowData>[]>([
    { field: "plant" },
    { field: "productionCost", headerName: "Production Cost", valueFormatter },
    { field: "quantity", headerName: "Qty", maxWidth: 100 },
    { field: "subtotal", valueFormatter, allowFormula: true },
    { field: "tax", headerName: "Tax (18%)", valueFormatter, allowFormula: true },
    { field: "total", valueFormatter, allowFormula: true },
  ]);

  const defaultColDef = useMemo<ColDef<PlantRowData>>(
    () => ({
      editable: true,
      flex: 1,
    }),
    []
  );

  return (
    <div style={containerStyle} className="ag-theme-alpine">
      <div style={gridStyle}>
        <AgGridReact<PlantRowData>
          rowData={rowData}
          getRowId={getRowId}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
        />
      </div>
    </div>
  );
};

export default MahindraPlantGrid;


const root = createRoot(document.getElementById("root")!);
root.render(<MahindraPlantGrid />);
