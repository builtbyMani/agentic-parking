import React, { useState, useRef, useEffect } from 'react';
import { NegotiationEvent, WinnerData, ValidatedMove } from '../types';
import { ShieldAlert, Car, Building2, CheckCircle2, ChevronDown, ChevronUp, Clock, ExternalLink, Compass } from 'lucide-react';

interface NegotiationTheaterProps {
  events: NegotiationEvent[];
  winner: WinnerData | null;
  onOpenCheckout: (winner: WinnerData) => void;
  isPacing: boolean;
  onStartTrigger?: () => void;
  onReplayTrigger?: () => void;
}

export const NegotiationTheater: React.FC<NegotiationTheaterProps> = ({
  events,
  winner,
  onOpenCheckout,
  isPacing,
  onStartTrigger,
  onReplayTrigger,
}) => {
  const [expandedReasonings, setExpandedReasonings] = useState<Record<string, boolean>>({});
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const toggleReasoning = (idx: string) => {
    setExpandedReasonings((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="bg-gradient-to-b from-[#112E46] via-[#163E5E] to-[#0B1E2E] text-white rounded-3xl p-6 flex flex-col h-full min-h-[640px] shadow-xl border border-[#226192]/40 relative overflow-hidden">
      {/* Background Blueprint Grid Texture */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blueprint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      </svg>

      {/* Top Editorial Header Bar (Ref: Image 2 blueprint style) */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/15">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-coral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-pulse" />
            <span>Dual-Agent Gemini Cluster</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight text-white mt-0.5">
            Negotiation Theater
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isPacing ? (
            <span className="text-[10px] text-coral-300 bg-coral-500/20 border border-coral-400/40 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold animate-pulse font-mono">
              <Clock className="w-3 h-3" /> 1200ms PACED
            </span>
          ) : (
            <span className="text-[10px] text-white/70 bg-white/10 border border-white/15 px-3 py-1 rounded-full font-mono font-semibold">
              {events.length} EVENTS RECORDED
            </span>
          )}
        </div>
      </div>

      {/* Centerpiece Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {events.length === 0 ? (
          /* Living Architectural Blueprint Standby View (Prevents empty blank card) */
          <div className="h-full min-h-[460px] flex flex-col justify-between p-2">
            {/* Top architectural slot layout preview */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono tracking-wider text-white/60 uppercase font-semibold">
                  Garage Telemetry · Bay Matrix
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Twin Synced
                </span>
              </div>

              {/* Graphical Top-down Bays */}
              <div className="grid grid-cols-3 gap-3 py-2">
                <div className="bg-white/10 border border-dashed border-white/20 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono font-bold text-white/80">Bay A-01</div>
                  <div className="w-8 h-12 bg-coral-500/80 rounded-md mx-auto my-2 border border-white/30 flex items-center justify-center text-[9px] font-mono font-bold">
                    Target
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400">IR Vacant</span>
                </div>

                <div className="bg-white/10 border border-dashed border-white/20 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono font-bold text-white/80">Bay B-01</div>
                  <div className="w-8 h-12 bg-white/30 rounded-md mx-auto my-2 border border-white/20" />
                  <span className="text-[9px] font-bold text-rose-400">IR Occupied</span>
                </div>

                <div className="bg-white/10 border border-dashed border-white/20 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono font-bold text-white/80">Bay C-01</div>
                  <div className="w-8 h-12 bg-coral-500/40 rounded-md mx-auto my-2 border border-white/20" />
                  <span className="text-[9px] font-bold text-emerald-400">IR Vacant</span>
                </div>
              </div>
            </div>

            {/* Middle Editorial Statement (Ref: Image 2 "FIND BEAUTY IN NATURE" layout) */}
            <div className="py-6 px-2">
              <div className="text-[10px] font-mono text-coral-400 tracking-widest uppercase mb-1">
                | PolicyGuard Active · Monotonic Convergence
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-white leading-snug">
                Driver Agent vs 3 Lot Hubs <br />
                <span className="text-coral-400">Real-Time Price Discovery</span>
              </h3>
              <p className="text-xs text-white/70 mt-2 max-w-[48ch] leading-relaxed">
                Autonomous models negotiate hourly parking tariffs down from public list rates.
                No human intervention required.
              </p>
            </div>

            {/* Bottom Quick-Launch Trigger Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onStartTrigger && (
                <button
                  onClick={onStartTrigger}
                  className="bg-coral-500 hover:bg-coral-600 text-white font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-coral-500/30 transition active:scale-95"
                >
                  <span>Launch Autonomous Bidding</span>
                  <span>→</span>
                </button>
              )}
              {onReplayTrigger && (
                <button
                  onClick={onReplayTrigger}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 transition active:scale-95"
                >
                  <span>Replay Golden Run (Offline)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Live Streaming Dialogue Stream */
          events.map((evt, idx) => {
            if (evt.event_type === 'LOT_SKIPPED') {
              return (
                <div
                  key={idx}
                  className="bg-amber-950/40 border border-amber-600/40 text-amber-200 rounded-xl py-2 px-3 text-xs text-center mx-auto max-w-md flex items-center justify-center gap-2"
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
                  <div className="h-[1px] flex-1 bg-white/15" />
                  <span className="text-[9px] font-bold text-coral-400 uppercase tracking-widest bg-white/10 px-3 py-0.5 rounded-full border border-white/15 font-mono">
                    Round {evt.data.round} Completed
                  </span>
                  <div className="h-[1px] flex-1 bg-white/15" />
                </div>
              );
            }

            if (evt.event_type === 'ACCEPT' && !evt.data.from_agent) {
              const data = evt.data;
              return (
                <div
                  key={idx}
                  className="bg-coral-500 text-white rounded-2xl p-4 my-2 shadow-xl shadow-coral-500/30 flex items-center justify-between border-2 border-white/40 animate-in fade-in duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm">
                        Deal Accepted: {data.winner_name || data.winner_lot_id || 'Winner'}
                      </div>
                      <div className="text-xs text-coral-100 font-medium mt-0.5">
                        {data.message || `Slot ${data.slot_id} reserved at ₹${data.agreed_rate_rupees || Math.round(data.agreed_rate_paise / 100)}/hr`}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-white text-coral-600 font-extrabold px-3 py-1 rounded-full shrink-0 shadow-sm font-mono">
                    Slot {data.slot_id}
                  </span>
                </div>
              );
            }

            if (evt.event_type === 'WALK_AWAY' && !evt.data.from_agent) {
              const data = evt.data;
              return (
                <div
                  key={idx}
                  className="bg-white/10 border border-white/15 text-white/80 rounded-full py-1.5 px-4 text-xs mx-auto max-w-md flex items-center justify-center gap-2"
                >
                  <span className="font-bold text-white">{data.lot_name || data.lot_id}:</span>
                  <span>{data.reason || 'Negotiation concluded.'}</span>
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
            const agentName = isDriver
              ? 'Driver Agent'
              : move.from_agent
              ? move.from_agent.replace('lot_', '')
              : move.lot_id || 'Agent';
            const priceRupees =
              move.price_per_hour_paise != null ? Math.round(move.price_per_hour_paise / 100) : 0;
            const rawPriceRupees =
              move.raw_llm_paise != null ? Math.round(move.raw_llm_paise / 100) : priceRupees;

            return (
              <div
                key={idx}
                className={`flex flex-col ${isDriver ? 'items-start' : 'items-end'} animate-in fade-in duration-300`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 border ${
                    isDriver
                      ? 'bg-coral-500/20 border-coral-400/50 text-white'
                      : 'bg-white/15 border-white/20 text-white'
                  } backdrop-blur-md shadow-md`}
                >
                  {/* Agent Header */}
                  <div className="flex items-center justify-between gap-3 text-xs pb-1.5 border-b border-white/15 mb-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isDriver ? <Car className="w-3.5 h-3.5 text-coral-400" /> : <Building2 className="w-3.5 h-3.5 text-white" />}
                      <span>{agentName}</span>
                      {move.model_used && (
                        <span className="text-[9px] text-white/70 font-mono px-1.5 py-0.5 bg-white/10 rounded border border-white/15">
                          {move.model_used}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {move.latency_ms != null && (
                        <span className="text-[9px] text-white/60 font-mono">{move.latency_ms}ms</span>
                      )}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold ${
                          move.action === 'ACCEPT'
                            ? 'bg-coral-500 text-white'
                            : move.action === 'WALK_AWAY'
                            ? 'bg-rose-500 text-white'
                            : isDriver
                            ? 'bg-coral-500 text-white'
                            : 'bg-white text-editorial-900'
                        }`}
                      >
                        {move.action} ₹{priceRupees}/hr
                      </span>
                    </div>
                  </div>

                  {/* Message prose */}
                  <p className="text-xs font-medium leading-relaxed text-white/95">{move.message}</p>

                  {/* Policy Guard Amber Clamped Badge */}
                  {move.guard_triggered && (
                    <div className="mt-2.5 bg-amber-500/20 border border-amber-400/60 rounded-xl p-2.5 text-xs text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>ANTI-HALLUCINATION BARRIER: CLAMPED</span>
                      </div>
                      <p className="text-[11px] leading-tight">
                        Raw LLM bid: <span className="line-through text-rose-300">₹{rawPriceRupees}/hr</span> → Enforced: <strong>₹{priceRupees}/hr</strong>
                      </p>
                      {move.guard_reason && (
                        <p className="text-[10px] text-amber-200 mt-1 italic font-mono">{move.guard_reason}</p>
                      )}
                    </div>
                  )}

                  {/* Collapsible Reasoning */}
                  {move.reasoning && (
                    <div className="mt-2 pt-1.5 border-t border-white/15">
                      <button
                        onClick={() => toggleReasoning(cardId)}
                        className="text-[10px] font-semibold text-white/70 hover:text-white flex items-center gap-1 transition"
                      >
                        <span>Agent Reasoning</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isExpanded && (
                        <p className="text-xs text-white/80 italic mt-1 bg-black/30 p-2.5 rounded-xl border border-white/10">
                          "{move.reasoning}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Winner Soft-Lock Banner Overlay at Bottom */}
      {winner && (
        <div className="relative z-10 mt-3 pt-3 border-t border-white/15">
          <div className="bg-coral-500 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between border border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">Locked: {winner.name}</h3>
                  <span className="text-xs bg-white text-coral-600 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
                    Slot {winner.slot_id}
                  </span>
                </div>
                <p className="text-xs text-coral-100 mt-0.5 font-medium">
                  Agreed Rate: <strong>₹{winner.agreed_rate_rupees}/hr</strong> | Total:{' '}
                  <strong>₹{winner.total_rupees}</strong> ({winner.usd_display} USD)
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenCheckout(winner)}
              className="bg-white hover:bg-ivory-50 text-coral-600 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95 shrink-0"
            >
              <span>Pay &amp; Get QR Pass</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
