import { useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { HyperFormula } from 'hyperformula';

import type { ColDef, RowStyle, RowClassParams } from 'ag-grid-community';
import '../../css/rfq-grid.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

type LevelType = 'Panel' | 'DieGroup' | 'Component';

interface RfqRow {
  level: LevelType;
  name: string;
  qty: number | '';
  netWt: number | '';
  rate: number | '';
  totalCost: number | '';
}

const initialRowData: RfqRow[] = [
  { level: 'Panel', name: 'P1', qty: '', netWt: '', rate: '', totalCost: '' },
  { level: 'DieGroup', name: 'DG-01', qty: '', netWt: '', rate: '', totalCost: '' },
  { level: 'Component', name: 'Base Plate', qty: 2, netWt: 12.5, rate: 180, totalCost: 0 },
  { level: 'Component', name: 'Guide Bush', qty: 4, netWt: 1.2, rate: 220, totalCost: 0 },
  { level: 'DieGroup', name: 'DG-02', qty: '', netWt: '', rate: '', totalCost: '' },
  { level: 'Component', name: 'Punch', qty: 6, netWt: 0.8, rate: 300, totalCost: 0 },
  { level: 'Component', name: 'Die Insert', qty: 2, netWt: 5.0, rate: 260, totalCost: 0 },
];

const RfqHierarchyGrid = () => {
  const gridRef = useRef<AgGridReact<RfqRow>>(null);
  const [rowData, setRowData] = useState<RfqRow[]>(initialRowData);
  const hfRef = useRef<HyperFormula | null>(null);
  const sheetIdRef = useRef<number | null>(null);

  // Convert rows to sheet format
  const rowsToSheet = (rows: RfqRow[]) => rows.map(r => [r.qty || 0, r.netWt || 0, r.rate || 0]);

  useEffect(() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'non-commercial-and-evaluation' });
    hfRef.current = hf;
  
    recalcTotals(initialRowData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columnDefs = useMemo<ColDef<RfqRow>[]>(() => [
    {
      field: 'level',
      width: 120,
      filter: 'agSetColumnFilter',
      sortable: true,
      resizable: true,
      filterParams: { buttons: ['apply', 'reset'], suppressMiniFilter: false },
    },
    {
      field: 'name',
      flex: 1,
      minWidth: 200,
      filter: 'agSetColumnFilter',
      sortable: true,
      resizable: true,
      filterParams: { buttons: ['apply', 'reset'], suppressMiniFilter: false },
    },
    {
      field: 'qty',
      width: 110,
      editable: p => p.data!.level === 'Component',
      valueParser: p => Number(p.newValue || 0),
      filter: 'agNumberColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        alwaysShowBothConditions: true,
        defaultJoinOperator: 'AND',
      },
    },
    {
      field: 'netWt',
      headerName: 'Net Wt',
      width: 120,
      editable: p => p.data!.level === 'Component',
      valueParser: p => Number(p.newValue || 0),
      filter: 'agNumberColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        alwaysShowBothConditions: true,
        defaultJoinOperator: 'AND',
      },
    },
    {
      field: 'rate',
      headerName: 'Rate/Kg',
      width: 120,
      editable: p => p.data!.level === 'Component',
      valueParser: p => Number(p.newValue || 0),
      filter: 'agNumberColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        alwaysShowBothConditions: true,
        defaultJoinOperator: 'AND',
      },
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 150,
      valueGetter: p => p.data!.totalCost !== '' ? Number(p.data!.totalCost).toFixed(2) : '',
      filter: 'agNumberColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        alwaysShowBothConditions: true,
        defaultJoinOperator: 'AND',
      },
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  const getRowStyle = (params: RowClassParams<RfqRow>): RowStyle | undefined => {
    if (params.data?.level === 'Panel') return { fontWeight: '700', backgroundColor: '#eef3ff' };
    if (params.data?.level === 'DieGroup') return { fontWeight: '600', backgroundColor: '#f7f9fc' };
    return undefined;
  };

  const recalcTotals = (rows: RfqRow[]) => {
    const hf = hfRef.current;
    const sheetId = sheetIdRef.current;
    if (!hf || sheetId === null) return;

    hf.clearSheet(sheetId);
    hf.setSheetContent(sheetId, rowsToSheet(rows));

    // Component totalCost = qty * netWt * rate
    rows.forEach((r, i) => {
      if (r.level === 'Component') {
        hf.setCellContents({ sheet: sheetId, row: i, col: 3 }, `=A${i + 1}*B${i + 1}*C${i + 1}`);
      }
    });

    // DieGroup totals
    let sum = 0;
    let currentGroupIndex = -1;
    rows.forEach((r, i) => {
      if (r.level === 'DieGroup') {
        if (currentGroupIndex !== -1) rows[currentGroupIndex].totalCost = sum;
        currentGroupIndex = i;
        sum = 0;
      }
      if (r.level === 'Component') {
        const val = hf.getCellValue({ sheet: sheetId, row: i, col: 3 }) as number;
        r.totalCost = val;
        sum += val;
      }
      if (r.level === 'Panel' && currentGroupIndex !== -1) {
        rows[currentGroupIndex].totalCost = sum;
        sum = 0;
      }
    });

    const panel = rows.find(r => r.level === 'Panel');
    if (panel) {
      panel.totalCost = rows
        .filter(r => r.level === 'DieGroup')
        .reduce((a, b) => a + Number(b.totalCost || 0), 0);
    }

    setRowData([...rows]);
    gridRef.current?.api.refreshCells({ force: true });
  };

  const onCellValueChanged = () => recalcTotals([...rowData]);

  return (
    <div className="rfq-page">
      <div className="rfq-grid-wrapper ag-theme-alpine" style={{ height: 500 }}>
        <AgGridReact<RfqRow>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          onCellValueChanged={onCellValueChanged}
          animateRows
          suppressRowClickSelection
        />
      </div>
    </div>
  );
};

export default RfqHierarchyGrid;
