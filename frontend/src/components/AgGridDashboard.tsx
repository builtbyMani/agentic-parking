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
        width: 95,
        pinned: 'left',
        cellRenderer: (params: any) => (
          <span className="font-mono font-extrabold text-editorial-800">{params.value}</span>
        ),
      },
      {
        field: 'lot_name',
        headerName: 'Lot Name',
        flex: 1,
        minWidth: 140,
        cellRenderer: (params: any) => (
          <span className="font-semibold text-editorial-800">{params.value}</span>
        ),
      },
      {
        field: 'distance_m',
        headerName: 'Distance',
        width: 100,
        valueFormatter: (params) => `${params.value}m`,
      },
      {
        field: 'list_rate',
        headerName: 'List Rate',
        width: 95,
        valueFormatter: (params) => `₹${params.value}/hr`,
      },
      {
        field: 'floor_rate',
        headerName: 'Floor',
        width: 90,
        valueFormatter: (params) => `₹${params.value}/hr`,
      },
      {
        field: 'sensor_occupied',
        headerName: 'IR Sensor',
        width: 125,
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
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isOcc
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
        width: 130,
        enableCellChangeFlash: true,
        cellRenderer: (params: any) => {
          const val = params.value;
          let badgeColor = 'bg-white text-editorial-600 border-[#DFD9CE]';
          if (val === 'SOFT_LOCK') {
            badgeColor = 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse font-bold';
          } else if (val === 'CONFIRMED') {
            badgeColor = 'bg-coral-50 text-coral-600 border-coral-200 font-extrabold';
          }
          return (
            <div className="flex items-center h-full">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${badgeColor}`}>
                {val}
              </span>
            </div>
          );
        },
      },
      {
        headerName: 'Twin Sim',
        width: 105,
        cellRenderer: (params: any) => (
          <button
            onClick={() => onToggleSensor(params.data.slot_id, params.data.sensor_occupied)}
            className="text-[10px] font-bold bg-white hover:bg-ivory-100 text-editorial-800 border border-[#DFD9CE] px-2 py-1 rounded-lg transition active:scale-95 shadow-xs"
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
    <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-sm flex flex-col h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-[#DFD9CE] mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-editorial-500" />
          <h3 className="text-sm font-extrabold text-editorial-800 tracking-tight">Live Inventory (AG Grid)</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-editorial-600">
          <Radio
            className={`w-3.5 h-3.5 ${
              rowData.length > 0 ? 'text-coral-500 animate-pulse' : 'text-editorial-400'
            }`}
          />
          <span className="font-medium">{rowData.length > 0 ? 'enableCellChangeFlash Active' : 'Waiting for Twin Telemetry...'}</span>
        </div>
      </div>

      <div className="flex-1 w-full ag-theme-quartz text-xs rounded-xl overflow-hidden border border-[#DFD9CE]">
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
          overlayNoRowsTemplate={
            '<span class="text-editorial-600 text-xs font-medium">No slots found. Connect gateway or trigger an offline replay.</span>'
          }
        />
      </div>
    </div>
  );
};
