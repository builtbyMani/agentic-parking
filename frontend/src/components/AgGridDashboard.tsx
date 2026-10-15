import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { LotPolicy, Slot } from '../types';
import { Activity, Radio } from 'lucide-react';

interface AgGridDashboardProps {
  lots: LotPolicy[];
  slots: Slot[];
  onToggleSensor: (slotId: string, currentOccupied: boolean) => void;
}

export const AgGridDashboard: React.FC<AgGridDashboardProps> = ({
  lots,
  slots,
  onToggleSensor,
}) => {
  // Join slots with their parent lot policies
  const rowData = useMemo(() => {
    return slots.map((s) => {
      const parentLot = lots.find((l) => l.lot_id === s.lot_id);
      return {
        slot_id: s.slot_id,
        lot_id: s.lot_id,
        lot_name: parentLot?.name || s.lot_id,
        distance_m: parentLot?.distance_m || 0,
        list_rate: parentLot ? Math.round(parentLot.base_list_paise / 100) : 0,
        floor_rate: parentLot ? Math.round(parentLot.base_floor_paise / 100) : 0,
        sensor_occupied: s.sensor_occupied === 1 || s.sensor_occupied === true,
        booking_status: s.booking_status,
      };
    });
  }, [lots, slots]);

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: 'slot_id',
        headerName: 'Slot',
        width: 100,
        pinned: 'left',
        cellRenderer: (params: any) => (
          <span className="font-mono font-bold text-white">{params.value}</span>
        ),
      },
      {
        field: 'lot_name',
        headerName: 'Lot Name',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'distance_m',
        headerName: 'Distance',
        width: 105,
        valueFormatter: (params) => `${params.value}m`,
      },
      {
        field: 'list_rate',
        headerName: 'List Rate',
        width: 105,
        valueFormatter: (params) => `₹${params.value}/hr`,
      },
      {
        field: 'floor_rate',
        headerName: 'Floor Limit',
        width: 110,
        valueFormatter: (params) => `₹${params.value}/hr`,
      },
      {
        field: 'sensor_occupied',
        headerName: 'IR Sensor',
        width: 130,
        enableCellChangeFlash: true,
        cellRenderer: (params: any) => {
          const isOcc = !!params.value;
          return (
            <div className="flex items-center gap-1.5 h-full">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOcc ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  isOcc
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isOcc ? 'Occupied' : 'Vacant'}
              </span>
            </div>
          );
        },
      },
      {
        field: 'booking_status',
        headerName: 'Reservation',
        width: 135,
        enableCellChangeFlash: true,
        cellRenderer: (params: any) => {
          const val = params.value;
          let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
          if (val === 'SOFT_LOCK') {
            badgeColor = 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse';
          } else if (val === 'CONFIRMED') {
            badgeColor = 'bg-sky-950 text-sky-300 border-sky-700';
          }
          return (
            <div className="flex items-center h-full">
              <span className={`text-xs px-2 py-0.5 rounded border font-mono font-semibold ${badgeColor}`}>
                {val}
              </span>
            </div>
          );
        },
      },
      {
        headerName: 'Twin Sim',
        width: 115,
        cellRenderer: (params: any) => (
          <button
            onClick={() => onToggleSensor(params.data.slot_id, params.data.sensor_occupied)}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded transition active:scale-95"
            title="Simulate hardware IR sensor trip"
          >
            Toggle IR
          </button>
        ),
      },
    ],
    [onToggleSensor]
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Live Inventory (AG Grid Community)</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>enableCellChangeFlash Active</span>
        </div>
      </div>

      <div className="flex-1 w-full ag-theme-quartz-dark text-xs">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          suppressCellFocus={true}
          animateRows={true}
        />
      </div>
    </div>
  );
};
