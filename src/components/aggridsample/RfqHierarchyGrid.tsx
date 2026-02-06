import { useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, RowStyle, RowClassParams } from 'ag-grid-community';

import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../../css/rfq-grid.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

/* ---------------- TYPES ---------------- */

type LevelType = 'Panel' | 'DieGroup' | 'Component';

interface RfqRow {
  level: LevelType;
  name: string;
  qty: number | '';
  netWt: number | '';
  rate: number | '';
  totalCost: number | '';
}

/* ---------------- DATA ---------------- */

const initialRowData: RfqRow[] = [
  { level: 'Panel', name: 'P1', qty: '', netWt: '', rate: '', totalCost: '' },

  { level: 'DieGroup', name: 'DG-01', qty: '', netWt: '', rate: '', totalCost: '' },
  { level: 'Component', name: 'Base Plate', qty: 2, netWt: 12.5, rate: 180, totalCost: 0 },
  { level: 'Component', name: 'Guide Bush', qty: 4, netWt: 1.2, rate: 220, totalCost: 0 },

  { level: 'DieGroup', name: 'DG-02', qty: '', netWt: '', rate: '', totalCost: '' },
  { level: 'Component', name: 'Punch', qty: 6, netWt: 0.8, rate: 300, totalCost: 0 },
  { level: 'Component', name: 'Die Insert', qty: 2, netWt: 5.0, rate: 260, totalCost: 0 },
];

/* ---------------- FILTER PARAMS ---------------- */

const textFilterParams = {
  filterOptions: [
    'contains',
    'notContains',
    'equals',
    'notEqual',
    'startsWith',
    'endsWith',
    'blank',
    'notBlank',
  ],
  defaultOption: 'contains',
  maxNumConditions: 2, // enables AND / OR
};

const numberFilterParams = {
  filterOptions: [
    'equals',
    'notEqual',
    'lessThan',
    'lessThanOrEqual',
    'greaterThan',
    'greaterThanOrEqual',
    'inRange',
    'blank',
    'notBlank',
  ],
  defaultOption: 'equals',
  maxNumConditions: 2, // enables AND / OR
};

/* ---------------- COMPONENT ---------------- */

const RfqHierarchyGrid = () => {
  const gridRef = useRef<AgGridReact<RfqRow>>(null);
  const [rowData, setRowData] = useState<RfqRow[]>(initialRowData);

  /* ---------------- COLUMNS ---------------- */

  const columnDefs = useMemo<ColDef<RfqRow>[]>(() => [
    {
      field: 'level',
      width: 120,
      filter: 'agTextColumnFilter',
      filterParams: textFilterParams,
    },
    {
      field: 'name',
      flex: 1,
      minWidth: 200,
      filter: 'agTextColumnFilter',
      filterParams: textFilterParams,
    },
    {
      field: 'qty',
      width: 110,
      editable: p => p.data?.level === 'Component',
      filter: 'agNumberColumnFilter',
      filterParams: numberFilterParams,
      valueParser: p => Number(p.newValue || 0),
    },
    {
      field: 'netWt',
      headerName: 'Net Wt',
      width: 120,
      editable: p => p.data?.level === 'Component',
      filter: 'agNumberColumnFilter',
      filterParams: numberFilterParams,
      valueParser: p => Number(p.newValue || 0),
    },
    {
      field: 'rate',
      headerName: 'Rate/Kg',
      width: 120,
      editable: p => p.data?.level === 'Component',
      filter: 'agNumberColumnFilter',
      filterParams: numberFilterParams,
      valueParser: p => Number(p.newValue || 0),
    },
    {
      field: 'totalCost',
      headerName: 'Total Cost',
      width: 150,
      filter: 'agNumberColumnFilter',
      filterParams: numberFilterParams,
      valueFormatter: p =>
        typeof p.value === 'number' ? p.value.toFixed(2) : '',
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  /* ---------------- STYLES ---------------- */

  const getRowStyle = (
    params: RowClassParams<RfqRow>
  ): RowStyle | undefined => {
    if (params.data?.level === 'Panel') {
      return {
        fontWeight: '700',
        backgroundColor: '#eef3ff',
      };
    }
    if (params.data?.level === 'DieGroup') {
      return {
        fontWeight: '600',
        backgroundColor: '#f7f9fc',
      };
    }
    return undefined;
  };

  /* ---------------- CALCULATIONS ---------------- */

  const recalcTotals = (rows: RfqRow[]) => {
    // component totals
    rows.forEach(r => {
      if (r.level === 'Component') {
        const qty = Number(r.qty || 0);
        const netWt = Number(r.netWt || 0);
        const rate = Number(r.rate || 0);
        r.totalCost = qty * netWt * rate;
      } else {
        r.totalCost = '';
      }
    });

    // die group totals
    let currentGroup: RfqRow | null = null;
    let sum = 0;

    for (const r of rows) {
      if (r.level === 'DieGroup') {
        if (currentGroup) currentGroup.totalCost = sum;
        currentGroup = r;
        sum = 0;
      }
      if (r.level === 'Component') {
        sum += Number(r.totalCost || 0);
      }
      if (r.level === 'Panel') {
        if (currentGroup) currentGroup.totalCost = sum;
        currentGroup = null;
        sum = 0;
      }
    }
    if (currentGroup) currentGroup.totalCost = sum;

    // panel total
    const panel = rows.find(r => r.level === 'Panel');
    if (panel) {
      panel.totalCost = rows
        .filter(r => r.level === 'DieGroup')
        .reduce((a, b) => a + Number(b.totalCost || 0), 0);
    }
  };

  /* ---------------- EVENTS ---------------- */

  const onCellValueChanged = () => {
    const updated = [...rowData];
    recalcTotals(updated);
    setRowData(updated);
    gridRef.current?.api.refreshCells({ force: true });
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="rfq-page">
      <div className="rfq-grid-wrapper ag-theme-alpine">
        <AgGridReact<RfqRow>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          onCellValueChanged={onCellValueChanged}
          suppressRowClickSelection
          animateRows
        />
      </div>
    </div>
  );
};

export default RfqHierarchyGrid;
