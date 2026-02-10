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
  RowDragModule,
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
import "../../css/mahindra_poc.css";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  RowDragModule,
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
      width={35}
      height={35}
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
  const [loading, setLoading] = useState(true);
  const [rowData, setRowData] = useState<PlantRowData[]>([]);

  const createEmptyCols = () => {
    const obj: Record<string, null> = {};
    for (let i = 1; i <= 200; i++) obj[`col_${i}`] = null;
    return obj;
  };

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3001/plants")
      .then((res) => res.json())
      .then((baseData: PlantRowData[]) => {
        const rows: PlantRowData[] = [];
        let id = 1;
        const TOTAL_ROWS = 1000;

        for (const base of baseData) {
          if (rows.length >= TOTAL_ROWS) break;

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
        setLoading(false);
      });
  }, []);

  /* TREE-SAFE ROW DRAG */
  const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
    const moving = event.node?.data;
    const over = event.overNode?.data;
    if (!moving || !over) return;

    setRowData((prev) => {
      const updated = [...prev];
      const fromIndex = updated.findIndex((r) => r.id === moving.id);
      const toIndex = updated.findIndex((r) => r.id === over.id);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [row] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, row);
      return updated.map((r, i) => ({ ...r, srNo: i + 1 }));
    });
  }, []);

  /* MULTI ROW DELETE */
  const deleteSelectedRows = useCallback(() => {
    const selected = gridRef.current?.api.getSelectedNodes() || [];
    if (!selected.length) return;

    const ids = new Set(selected.map((n) => n.data?.id));

    setRowData((prev) =>
      prev
        .filter((r) => !ids.has(r.id))
        .map((r, i) => ({ ...r, srNo: i + 1 }))
    );
  }, []);

  const insertRowBelowNode = useCallback((node: any) => {
    if (!node?.data) return;

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

      return updated.map((r, i) => ({ ...r, srNo: i + 1 }));
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
        checkboxSelection: true,      // ✅ REQUIRED
        headerCheckboxSelection: true, // ✅ REQUIRED
        valueGetter: (p) =>
          p.node?.rowPinned ? "" : p.data?.srNo ?? "",
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
      { field: "productionCost", headerName: "Production Cost", minWidth: 60 },
      { field: "quantity", headerName: "Qty", minWidth: 60 },
      { field: "extraCost", headerName: "Extra Cost", minWidth: 60 },
    ];

    for (let i = 1; i <= 200; i++) {
      cols.push({
        field: `col_${i}`,
        headerName: `C${i}`,
        width: 90,
        minWidth: 90,
        editable: true,
        suppressSizeToFit: true,
        valueParser: (p) => {
          const v = Number(p.newValue);
          return isNaN(v) ? null : v;
        },
        ...(i === 200 && {
          headerName: "C200 (Formula)",
          valueGetter: (p) => {
            const pc = Number(p.data?.productionCost) || 0;
            const q = Number(p.data?.quantity) || 0;
            const ec = Number(p.data?.extraCost) || 0;
            return pc * q + ec;
          },
          aggFunc: "sum",
        }),
      });
    }

    return cols;
  }, []);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
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
        loading={loading}
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        components={{ ImageRenderer }}
        onRowDragEnd={onRowDragEnd}

        treeData
        getDataPath={(d) => d.path}
        groupDefaultExpanded={-1}
        grandTotalRow="bottom"

        /* ✅ REQUIRED FOR TREE DATA SELECTION */
        isRowSelectable={() => true}
        groupSelectsChildren={true}

        /* ✅ NEW SELECTION API */
        rowSelection={{
          mode: "multiRow",
          enableClickSelection: false,
        }}

        enableRangeSelection
        undoRedoCellEditing
        singleClickEdit
        animateRows
        sideBar
        rowHeight={44}

        getContextMenuItems={(params) => [
          { name: "Insert Row Below", action: () => insertRowBelowNode(params.node) },
          { name: "Delete Selected Rows", action: () => deleteSelectedRows() },
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

// const root = createRoot(document.getElementById("root")!);
// root.render(<MahindraPlantGrid />);
