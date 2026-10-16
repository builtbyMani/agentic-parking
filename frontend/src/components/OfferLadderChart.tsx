import React, { useMemo } from 'react';
import { NegotiationEvent, ValidatedMove } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown } from 'lucide-react';

interface OfferLadderChartProps {
  events: NegotiationEvent[];
}

export const OfferLadderChart: React.FC<OfferLadderChartProps> = ({ events }) => {
  const chartData = useMemo(() => {
    // Map moves into rounds
    const roundsMap: Record<string, any> = {
      Opening: { round: 'Opening', driver: null, LOT_A: null, LOT_B: null, LOT_C: null },
      'Round 1': { round: 'Round 1', driver: null, LOT_A: null, LOT_B: null, LOT_C: null },
      'Round 2': { round: 'Round 2', driver: null, LOT_A: null, LOT_B: null, LOT_C: null },
      'Round 3': { round: 'Round 3', driver: null, LOT_A: null, LOT_B: null, LOT_C: null },
    };

    events.forEach((evt) => {
      if (['REQUEST', 'OFFER', 'COUNTER'].includes(evt.event_type) && evt.data?.price_per_hour_paise != null) {
        const move = evt.data as ValidatedMove;
        const roundKey = move.round_num === 0 ? 'Opening' : `Round ${move.round_num}`;
        if (!roundsMap[roundKey]) {
          roundsMap[roundKey] = { round: roundKey, driver: null, LOT_A: null, LOT_B: null, LOT_C: null };
        }
        const rupees = Math.round(move.price_per_hour_paise / 100);
        if (move.from_agent === 'driver') {
          roundsMap[roundKey].driver = rupees;
        } else if (move.lot_id) {
          roundsMap[roundKey][move.lot_id] = rupees;
        }
      }
    });

    return Object.values(roundsMap).filter((r) =>
      r.driver !== null || r.LOT_A !== null || r.LOT_B !== null || r.LOT_C !== null
    );
  }, [events]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">Offer Ladder (Price Convergence)</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Rates in ₹/hr</span>
      </div>

      <div className="flex-1 w-full min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Awaiting negotiation rounds to plot trajectory...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="round" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`₹${value}/hr`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line
                type="monotone"
                dataKey="driver"
                name="Driver Bid"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_A"
                name="Lot A"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: '#10b981' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_B"
                name="Lot B"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 4, fill: '#a855f7' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_C"
                name="Lot C"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f59e0b' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
