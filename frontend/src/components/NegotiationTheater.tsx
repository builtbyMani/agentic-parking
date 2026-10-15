import React, { useState } from 'react';
import { NegotiationEvent, WinnerData, ValidatedMove } from '../types';
import { ShieldAlert, Car, Building2, CheckCircle2, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';

interface NegotiationTheaterProps {
  events: NegotiationEvent[];
  winner: WinnerData | null;
  onOpenCheckout: (winner: WinnerData) => void;
  isPacing: boolean;
}

export const NegotiationTheater: React.FC<NegotiationTheaterProps> = ({
  events,
  winner,
  onOpenCheckout,
  isPacing,
}) => {
  const [expandedReasonings, setExpandedReasonings] = useState<Record<string, boolean>>({});

  const toggleReasoning = (idx: string) => {
    setExpandedReasonings((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Extract valid moves and rounds
  const moves: { move: ValidatedMove; index: number }[] = [];
  events.forEach((evt, idx) => {
    if (['REQUEST', 'OFFER', 'COUNTER', 'ACCEPT', 'WALK_AWAY'].includes(evt.event_type)) {
      moves.push({ move: evt.data as ValidatedMove, index: idx });
    }
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[700px] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-lg font-bold text-white tracking-wide">Negotiation Theater</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            1200ms Paced Dialogue
          </span>
        </div>
        {isPacing && (
          <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Pacing Rounds...
          </span>
        )}
      </div>

      {/* Chat Dialogue Scroll Container */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
            <Car className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
            <p>Start an autonomous negotiation or replay an offline golden run.</p>
          </div>
        )}

        {events.map((evt, idx) => {
          if (evt.event_type === 'LOT_SKIPPED') {
            return (
              <div
                key={idx}
                className="bg-amber-950/30 border border-amber-800/40 text-amber-300/80 rounded-lg py-2 px-3 text-xs text-center mx-auto max-w-md flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>{evt.data.lot_id}</strong> skipped: {evt.data.distance_m}m exceeds driver's {evt.data.max_distance_m}m limit.
                </span>
              </div>
            );
          }

          if (evt.event_type === 'ROUND_COMPLETED') {
            return (
              <div key={idx} className="flex items-center gap-3 my-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                  Round {evt.data.round}
                </span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>
            );
          }

          if (!['REQUEST', 'OFFER', 'COUNTER', 'ACCEPT', 'WALK_AWAY'].includes(evt.event_type)) {
            return null;
          }

          const move = evt.data as ValidatedMove;
          const isDriver = move.from_agent === 'driver';
          const cardId = `card-${idx}`;
          const isExpanded = !!expandedReasonings[cardId];

          return (
            <div
              key={idx}
              className={`flex flex-col ${isDriver ? 'items-start' : 'items-end'} animate-in fade-in duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 border ${
                  isDriver
                    ? 'bg-sky-950/40 border-sky-800/60 text-sky-100'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100'
                } shadow-md`}
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between gap-3 text-xs pb-1.5 border-b border-slate-700/50 mb-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isDriver ? <Car className="w-3.5 h-3.5 text-sky-400" /> : <Building2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isDriver ? 'Driver Agent' : move.from_agent.replace('lot_', '')}</span>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 bg-slate-800 rounded">
                      {move.model_used}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{move.latency_ms}ms</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        move.action === 'ACCEPT'
                          ? 'bg-emerald-500 text-slate-950'
                          : move.action === 'WALK_AWAY'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {move.action} ₹{Math.round(move.price_per_hour_paise / 100)}/hr
                    </span>
                  </div>
                </div>

                {/* Message prose */}
                <p className="text-sm font-medium leading-relaxed">{move.message}</p>

                {/* Policy Guard Amber Clamped Badge */}
                {move.guard_triggered && (
                  <div className="mt-2.5 bg-amber-950/70 border border-amber-600/80 rounded-lg p-2 text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-0.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>ANTI-HALLUCINATION BARRIER: CLAMPED</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-tight">
                      Raw LLM bid: <span className="line-through text-rose-400">₹{Math.round(move.raw_llm_paise / 100)}/hr</span> → Enforced: <strong>₹{Math.round(move.price_per_hour_paise / 100)}/hr</strong>
                    </p>
                    {move.guard_reason && (
                      <p className="text-[10px] text-amber-300/70 mt-1 italic font-mono">{move.guard_reason}</p>
                    )}
                  </div>
                )}

                {/* Collapsible Reasoning */}
                {move.reasoning && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleReasoning(cardId)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                    >
                      <span>Agent Reasoning</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {isExpanded && (
                      <p className="text-xs text-slate-300/80 italic mt-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                        "{move.reasoning}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Winner Soft-Lock Banner */}
      {winner && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/60 rounded-xl p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Locked: {winner.name}</h3>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono font-semibold">
                    Slot {winner.slot_id}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Agreed Rate: <strong>₹{winner.agreed_rate_rupees}/hr</strong> | Total:{' '}
                  <strong>₹{winner.total_rupees}</strong> ({winner.usd_display} USD)
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenCheckout(winner)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <span>Pay & Get QR Pass</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
