import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'flag-icons/css/flag-icons.min.css';
import "../../css/mahindra_poc.css";

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
  RowSelectionModule,
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



ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextEditorModule,
  NumberEditorModule,
  RowDragModule,
  RowSelectionModule,
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

  const openPreview = () => {
    if (props.context?.setPreviewImage) {
      props.context.setPreviewImage(src);
    }
  };

  return (
    <img
      src={src}
      width={25}
      height={25}
      style={{
        objectFit: "cover",
        borderRadius: 4,
        cursor: "pointer",
      }}
      loading="lazy"
      alt=""
      onClick={openPreview}
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);



  const createEmptyCols = () => {
    const obj: Record<string, null> = {};
    for (let i = 1; i <= 200; i++) obj[`col_${i}`] = null;
    return obj;
  };

  useEffect(() => {
    fetch("http://localhost:3001/plants")
      .then((res) => res.json())
      .then((baseData: PlantRowData[]) => {
        requestIdleCallback(() => {
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

          setTimeout(() => {
            gridRef.current?.api.hideOverlay();
          }, 0);
        });
      });
  }, []);

  const exportToExcel = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    api.exportDataAsExcel({
      fileName: "Mahindra_Plant_Data.xlsx",
      sheetName: "Plant Data",
      allColumns: true,
    });
  }, []);


  const rollupCost = useCallback((node: any) => {
    if (!node) return;

    const data = node.data;
    if (!data) return;

    // Calculate current row total
    const pc = Number(data.productionCost) || 0;
    const q = Number(data.quantity) || 0;
    const ec = Number(data.extraCost) || 0;

    const rowTotal = pc * q + ec;

    data.totalCost = rowTotal;
    node.setDataValue("totalCost", rowTotal);

    // Move upward
    let parent = node.parent;

    while (parent && parent.data) {
      let sum = 0;

      parent.childrenAfterGroup?.forEach((child: any) => {
        const childTotal = Number(child.data?.totalCost) || 0;
        sum += childTotal;
      });

      parent.data.totalCost = sum;
      parent.setDataValue("totalCost", sum);

      parent = parent.parent;
    }
  }, []);



  const onRowDragEnd = useCallback((event: RowDragEndEvent) => {
    const api = gridRef.current?.api;
    if (!api) return;

    const movingNodes = api.getSelectedNodes().length
      ? api.getSelectedNodes()
      : [event.node];

    const overNode = event.overNode;
    if (!overNode) return;

    const movingIds = new Set(
      movingNodes.map((n) => n.data?.id)
    );

    setRowData((prev) => {
      const remaining = prev.filter((r) => !movingIds.has(r.id));

      const overIndex = remaining.findIndex(
        (r) => r.id === overNode.data?.id
      );

      const movingRows = prev.filter((r) => movingIds.has(r.id));

      remaining.splice(overIndex, 0, ...movingRows);

      return remaining.map((r, i) => ({
        ...r,
        srNo: i + 1,
      }));
    });
  }, []);



  const deleteSelectedRows = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const selectedNodes = api.getSelectedNodes();
    if (!selectedNodes.length) return;

    const ids = new Set(
      selectedNodes
        .map((n) => n.data?.id)
        .filter((id): id is number => id !== undefined)
    );

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
        headerName: "Sr.No",
        pinned: "left",
        width: 110,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        rowDrag: true,
        valueGetter: (p) => p.data?.srNo ?? "",
      },
      {
        headerName: "Image",
        field: "image",
        // pinned: "left",
         width: 90,
        // editable: false,
        cellRenderer: ImageRenderer,
      },
      {
        field: "plant",
        headerName: "Plant / BOM",
        // pinned: "left",
        // minWidth: 260,
        // cellRenderer: "agGroupCellRenderer",
        // editable: true,
      },
      { field: "productionCost", headerName: "Production Cost" },
      { field: "quantity", headerName: "Qty" },
      { field: "extraCost", headerName: "Extra Cost" },
      // {
      //   field: "totalCost",
      //   headerName: "Total Cost",
      //   editable: false,
      //   valueGetter: (p) => {
      //     const pc = Number(p.data?.productionCost) || 0;
      //     const q = Number(p.data?.quantity) || 0;
      //     const ec = Number(p.data?.extraCost) || 0;
      //     return pc * q + ec;
      //   },
      // },


    ];

    for (let i = 1; i <= 200; i++) {
      cols.push({
        field: `col_${i}`,
        headerName: `C${i}`,
        width: 90,
        editable: true,
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
          // aggFunc: "sum",
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
    <>
      <div className="ag-theme-alpine" style={{ width: "100%", height: "100vh" }}>
        <AgGridReact<PlantRowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          context={{ setPreviewImage }}
          groupDisplayType="custom"

          enableRangeSelection={true}
          enableFillHandle={true}
          undoRedoCellEditing={true}
          suppressClipboardPaste={false}

          components={{ ImageRenderer }}
          overlayLoadingTemplate={
            '<span class="ag-overlay-loading-center">Loading data…</span>'
          }
          onGridReady={(p) => p.api.showLoadingOverlay()}
          treeData
          getDataPath={(d) => d.path}
          groupDefaultExpanded={0}
          rowSelection={{
            mode: "multiRow",
            enableClickSelection: false,
            checkboxes: false,
          }}

          animateRows
          sideBar
          suppressRowVirtualisation={false}
          suppressColumnVirtualisation={false}
          rowBuffer={10}
          onRowDragEnd={onRowDragEnd}
          getContextMenuItems={(params) => [
            {
              name: "Insert Row Below",
              cssClasses: ["menu-insert"],
              action: () => insertRowBelowNode(params.node),
            },
            {
              name: "Delete Selected Rows",
              cssClasses: ["menu-delete"],
              action: () => deleteSelectedRows(),
            },
            {
              name: "Export to Excel",
              action: () => exportToExcel(),
            },
            "separator",
            "copy",
            "paste",
          ]}

          onCellValueChanged={(params) => {
            if (
              params.colDef.field === "productionCost" ||
              params.colDef.field === "quantity" ||
              params.colDef.field === "extraCost"
            ) {
              rollupCost(params.node);
            }
          }}


          onCellKeyDown={(params) => {
            const e = params.event as KeyboardEvent;

            if ((e.ctrlKey || e.metaKey) && e.key === "v") {
              e.preventDefault();
              params.api.pasteFromClipboard();
            }

            if (e.key === "Delete" || e.key === "Backspace") {
              deleteSelectedRows();
            }
          }}


        />

      </div>
      {previewImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            style={{
              maxWidth: "80%",
              maxHeight: "80%",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            alt=""
          />
        </div>
      )}

    </>

  );

};

export default MahindraPlantGrid;
