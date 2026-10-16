import React, { useState } from 'react';
import { usePacedStream } from './hooks/usePacedStream';
import { NegotiationTheater } from './components/NegotiationTheater';
import { OfferLadderChart } from './components/OfferLadderChart';
import { AgGridDashboard } from './components/AgGridDashboard';
import { QRPassModal } from './components/QRPassModal';
import { WinnerData, DriverConstraints } from './types';
import {
  Car,
  ShieldCheck,
  Play,
  RotateCcw,
  DoorOpen,
  DoorClosed,
  Wifi,
  WifiOff,
  Cpu,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    events,
    isPacing,
    isConnected,
    lots,
    slots,
    gateState,
    winner,
    statusText,
    startNegotiation,
    triggerReplay,
    clearEvents,
    setSlots,
  } = usePacedStream(1200);

  // Driver input parameters
  const [budgetRupees, setBudgetRupees] = useState<number>(38);
  const [maxDistance, setMaxDistance] = useState<number>(400);
  const [hours, setHours] = useState<number>(3);
  const [prepay, setPrepay] = useState<boolean>(true);

  // Modal state
  const [checkoutWinner, setCheckoutWinner] = useState<WinnerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleStartNegotiation = () => {
    const constraints: DriverConstraints = {
      max_budget_per_hour_paise: budgetRupees * 100,
      max_walk_distance_m: maxDistance,
      hours: hours,
      prepay: prepay,
      walk_penalty_paise_per_m: 2,
    };
    startNegotiation(constraints);
  };

  const handleOpenCheckout = (w: WinnerData) => {
    setCheckoutWinner(w);
    setIsModalOpen(true);
  };

  const handleToggleSlotSensor = async (slotId: string, currentOccupied: boolean) => {
    const nextOccupied = !currentOccupied;
    // Optimistic UI update
    setSlots((prev) =>
      prev.map((s) => (s.slot_id === slotId ? { ...s, sensor_occupied: nextOccupied ? 1 : 0 } : s))
    );
    try {
      const apiBase = typeof window !== 'undefined' && window.location.port === '5173' ? '' : 'http://localhost:8000';
      await fetch(`${apiBase}/api/hardware/toggle-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, occupied: nextOccupied }),
      });
    } catch (err) {
      console.error('Failed to toggle sensor:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Car className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">Agentic Parking Gateway</h1>
                <span className="text-[10px] bg-sky-950 border border-sky-800 text-sky-300 font-mono font-bold px-1.5 py-0.5 rounded">
                  Dual-Agent Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400">
                7 Deterministic Anti-Hallucination Barriers • PayPal v2 • Physical ESP32 Twin
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Gate State Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                gateState === 'OPEN'
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              {gateState === 'OPEN' ? <DoorOpen className="w-4 h-4 text-emerald-400" /> : <DoorClosed className="w-4 h-4 text-slate-400" />}
              <span>Gate: {gateState}</span>
            </div>

            {/* Hardware Mode Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-slate-800/80 border-slate-700 text-slate-300">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Twin: Virtual / USB</span>
            </div>

            {/* WebSocket Connectivity Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
                isConnected
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isConnected ? 'Hub Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Command Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Driver Negotiation Parameter Inputs */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
              <label htmlFor="budget-input" className="text-slate-400 font-medium">Hidden Budget:</label>
              <div className="flex items-center font-bold text-white">
                <span>₹</span>
                <input
                  id="budget-input"
                  type="number"
                  aria-label="Hidden Budget in Rupees"
                  value={budgetRupees}
                  onChange={(e) => setBudgetRupees(Number(e.target.value))}
                  className="w-12 bg-transparent text-white font-bold outline-none ml-0.5"
                />
                <span className="text-slate-400">/hr</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
              <label htmlFor="distance-input" className="text-slate-400 font-medium">Max Walk:</label>
              <input
                id="distance-input"
                type="number"
                aria-label="Max Walking Distance in Meters"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-14 bg-transparent text-white font-bold outline-none"
              />
              <span className="text-slate-400">meters</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
              <label htmlFor="hours-input" className="text-slate-400 font-medium">Duration:</label>
              <input
                id="hours-input"
                type="number"
                aria-label="Duration in Hours"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-8 bg-transparent text-white font-bold outline-none"
              />
              <span className="text-slate-400">hrs</span>
            </div>

            <label className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={prepay}
                onChange={(e) => setPrepay(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="font-medium">Prepaid Discount</span>
            </label>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleStartNegotiation}
              disabled={isPacing}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Autonomous Negotiation</span>
            </button>

            <button
              onClick={triggerReplay}
              disabled={isPacing}
              className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/10 transition active:scale-95"
              title="Replays pre-recorded 22-event trace for offline zero-Wi-Fi hackathon demos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Offline Replay</span>
            </button>

            <button
              onClick={clearEvents}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Negotiation Theater */}
        <div className="lg:col-span-7">
          <NegotiationTheater
            events={events}
            winner={winner}
            onOpenCheckout={handleOpenCheckout}
            isPacing={isPacing}
          />
        </div>

        {/* Right Column (5 cols): Offer Ladder + AG Grid Dashboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <OfferLadderChart events={events} />
          <AgGridDashboard
            lots={lots}
            slots={slots}
            onToggleSensor={handleToggleSlotSensor}
          />
        </div>
      </main>

      {/* Floating Status Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-2.5 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>PolicyGuard: Effective Floor Clamp • Monotonic Convergence • Prose Regex Sanitizer Active</span>
        </div>
        <div className="font-mono text-slate-400">Status: {statusText}</div>
      </footer>

      {/* PayPal Checkout & HMAC QR Pass Modal */}
      <QRPassModal
        winner={checkoutWinner}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default App;
