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
    <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-sm flex flex-col h-[340px]">
      <div className="flex items-center justify-between pb-3 border-b border-[#DFD9CE] mb-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-editorial-500" />
          <h3 className="text-sm font-extrabold text-editorial-800 tracking-tight">Offer Ladder (Price Convergence)</h3>
        </div>
        <span className="text-xs text-editorial-600 font-mono font-medium">Rates in ₹/hr</span>
      </div>

      <div className="flex-1 w-full min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-editorial-600 text-xs font-medium">
            Awaiting negotiation rounds to plot trajectory...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DFD9CE" />
              <XAxis dataKey="round" stroke="#8696A4" tick={{ fill: '#4A5E70', fontSize: 11, fontWeight: 600 }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#8696A4"
                tick={{ fill: '#4A5E70', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DFD9CE',
                  borderRadius: '12px',
                  color: '#112E46',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(17, 46, 70, 0.08)',
                }}
                formatter={(value: any) => [`₹${value}/hr`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line
                type="monotone"
                dataKey="driver"
                name="Driver Bid"
                stroke="#EF5537"
                strokeWidth={3}
                dot={{ r: 4, fill: '#EF5537' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_A"
                name="Lot A"
                stroke="#226192"
                strokeWidth={2}
                dot={{ r: 4, fill: '#226192' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_B"
                name="Lot B"
                stroke="#112E46"
                strokeWidth={2}
                dot={{ r: 4, fill: '#112E46' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="LOT_C"
                name="Lot C"
                stroke="#4A7C9F"
                strokeWidth={2}
                dot={{ r: 4, fill: '#4A7C9F' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
