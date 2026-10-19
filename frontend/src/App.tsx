import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { usePacedStream } from './hooks/usePacedStream';
import { Navbar, SectionId } from './components/Navbar';
import { NegotiationTheater } from './components/NegotiationTheater';
import { OfferLadderChart } from './components/OfferLadderChart';
import { AgGridDashboard } from './components/AgGridDashboard';
import { QRPassModal } from './components/QRPassModal';
import { NotFound } from './components/NotFound';
import { WinnerData, DriverConstraints } from './types';
import {
  Play,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  User,
  Sliders,
  ArrowRight,
  ArrowDown,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  Car,
  MapPin,
  Building2,
  QrCode,
  DollarSign,
  Activity,
  Check,
} from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export const App: React.FC = () => {
  const {
    events,
    isPacing,
    isConnected,
    lots,
    slots,
    gateState,
    winner,
    startNegotiation,
    triggerReplay,
    clearEvents,
    setSlots,
  } = usePacedStream(1200);

  // Active section tracking for navbar dot
  const [activeSection, setActiveSection] = useState<SectionId>('home');

  // Driver input parameters
  const [budgetRupees, setBudgetRupees] = useState<number>(38);
  const [maxDistance, setMaxDistance] = useState<number>(400);
  const [hours, setHours] = useState<number>(3);
  const [prepay, setPrepay] = useState<boolean>(true);

  // Modals & Navigation state
  const [checkoutWinner, setCheckoutWinner] = useState<WinnerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(false);
  const [is404Active, setIs404Active] = useState<boolean>(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    facility: '',
    bays: '25',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Container ref for GSAP context
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Trigger success toast when deal winner locks
  useEffect(() => {
    if (winner) {
      setToast({
        type: 'success',
        message: `Deal locked with ${winner.name} at ₹${winner.agreed_rate_rupees}/hr. Slot ${winner.slot_id} reserved!`,
      });
    }
  }, [winner]);

  // Check URL pathname for 404 test
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/404') {
      setIs404Active(true);
    }
  }, []);

  // GSAP ScrollTrigger setup for all 5 vertical sections
  useEffect(() => {
    if (is404Active) return;

    const ctx = gsap.context(() => {
      const sectionIds: SectionId[] = ['home', 'fleets', 'hosts', 'contact', 'about'];

      // Active Section ScrollTrigger observers
      sectionIds.forEach((id) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setActiveSection(id),
          onEnterBack: () => setActiveSection(id),
        });
      });

      // Section 1: Hero entrance animation
      gsap.from('#home-content', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: 'power3.out',
      });

      // Section 2: Fleets entrance animation
      gsap.from('.fleet-card', {
        scrollTrigger: {
          trigger: '#fleets',
          start: 'top 75%',
        },
        opacity: 0,
        y: 35,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Section 3: Hosts entrance animation
      gsap.from('.host-panel', {
        scrollTrigger: {
          trigger: '#hosts',
          start: 'top 75%',
        },
        opacity: 0,
        y: 35,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Section 4: Contact entrance animation
      gsap.from('.contact-panel', {
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 75%',
        },
        opacity: 0,
        y: 35,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out',
      });

      // Section 5: About pillars entrance animation
      gsap.from('.pillar-card', {
        scrollTrigger: {
          trigger: '#about',
          start: 'top 75%',
        },
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
      });
    }, mainContainerRef);

    return () => ctx.revert();
  }, [is404Active]);

  // Smooth scroll handler using GSAP ScrollToPlugin
  const handleNavigate = (sectionId: SectionId) => {
    setIs404Active(false);
    setActiveSection(sectionId);
    gsap.to(window, {
      duration: 1.0,
      scrollTo: { y: `#${sectionId}`, offsetY: 60 },
      ease: 'power3.inOut',
    });
  };

  const handleStartNegotiation = () => {
    if (budgetRupees < 20) {
      setToast({ type: 'error', message: 'Budget must be at least ₹20/hr to match lot floor limits.' });
      return;
    }
    const constraints: DriverConstraints = {
      max_budget_per_hour_paise: budgetRupees * 100,
      max_walk_distance_m: maxDistance,
      hours: hours,
      prepay: prepay,
      walk_penalty_paise_per_m: 2,
    };
    startNegotiation(constraints);
    setToast({ type: 'success', message: 'Autonomous bidding dispatched to Gemini Dual-Agent cluster.' });
  };

  const handleOpenCheckout = (w: WinnerData) => {
    setCheckoutWinner(w);
    setIsModalOpen(true);
  };

  const handleToggleSlotSensor = async (slotId: string, currentOccupied: boolean) => {
    const nextOccupied = !currentOccupied;
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
      setToast({
        type: 'success',
        message: `Slot ${slotId} sensor updated: ${nextOccupied ? 'Occupied' : 'Vacant'}.`,
      });
    } catch {
      setToast({ type: 'error', message: 'Could not contact hardware twin daemon.' });
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) {
      setToast({ type: 'error', message: 'Please enter your email and message.' });
      return;
    }
    setFormSubmitted(true);
    setToast({ type: 'success', message: 'Thank you! Your facility application has been routed to our onboarding team.' });
    setTimeout(() => {
      setContactForm({ name: '', email: '', facility: '', bays: '25', message: '' });
      setFormSubmitted(false);
    }, 4000);
  };

  if (is404Active) {
    return <NotFound onBackToHome={() => setIs404Active(false)} />;
  }

  return (
    <div ref={mainContainerRef} className="min-h-screen bg-[#EAE6DE] text-editorial-800 flex flex-col font-sans selection:bg-[#EF5537] selection:text-white">
      {/* Toast Feedback Notification Banner */}
      {toast && (
        <aside aria-label="System Notifications" className="fixed top-20 right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-900 shadow-emerald-500/10'
                : 'bg-white border-rose-300 text-rose-900 shadow-rose-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Top Navigation Bar with active dot indicator */}
      <Navbar
        activeSection={activeSection}
        gateState={gateState}
        isConnected={isConnected}
        onNavigate={handleNavigate}
        onSignInClick={() => setIsSignInOpen(true)}
      />

      {/* ========================================================================= */}
      {/* PAGE 1: LANDING PAGE (#home)                                              */}
      {/* Requirement: ONLY contain the title and a quote tagline of what parkos does*/}
      {/* ========================================================================= */}
      <section
        id="home"
        className="min-h-[calc(100vh-65px)] flex flex-col justify-between py-12 md:py-16 px-6 max-w-7xl w-full mx-auto relative"
      >
        <div id="home-content" className="flex-1 flex flex-col justify-center items-center text-center my-auto">
          {/* Sculptured Triple Stack Title (Matching Bloom / Reference Design) */}
          <div className="space-y-0 font-display uppercase font-black select-none tracking-tighter">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-editorial-800 leading-[0.85]">
              PARKOS
            </h1>
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-stroke-editorial leading-[0.85] opacity-90">
              PARKOS
            </div>
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-editorial-800 leading-[0.85]">
              PARKOS
            </div>
          </div>

          {/* Tagline Quotation quoting what Parkos does */}
          <div className="mt-10 max-w-2xl px-4">
            <blockquote className="text-base sm:text-lg md:text-xl font-medium text-editorial-700 leading-relaxed italic border-x-2 border-coral-500/40 px-6 py-2 bg-[#FAF8F5]/60 rounded-2xl backdrop-blur-xs">
              “Dual-agent Gemini models negotiate parking tariffs below list price in real time — settling micro-transactions over PayPal v2 and unlocking physical vision gates.”
            </blockquote>
          </div>
        </div>

        {/* Bottom Explore Button with Micro-Spring */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => handleNavigate('fleets')}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#FAF8F5] border border-[#DFD9CE] text-xs font-bold uppercase tracking-widest text-editorial-800 hover:text-coral-500 hover:border-coral-400 transition-all duration-200 shadow-[0_3px_0_#DFD9CE] active:translate-y-0.5 active:shadow-none cursor-pointer group"
          >
            <span>Explore Fleets &amp; Capacity</span>
            <div className="w-6 h-6 rounded-full bg-editorial-800 text-white flex items-center justify-center group-hover:bg-coral-500 transition-colors">
              <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 2: FLEETS PAGE (#fleets)                                             */}
      {/* Dedicated full page for lot network, bay inventory & ESP32 hardware twin  */}
      {/* ========================================================================= */}
      <section
        id="fleets"
        className="min-h-screen py-16 px-6 max-w-7xl w-full mx-auto border-t border-[#DFD9CE] flex flex-col justify-start"
      >
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-coral-600 uppercase mb-2">
              01 / Fleet Network
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-editorial-800 tracking-tight uppercase">
              Live Lot Inventory &amp; Sensor Twin
            </h2>
          </div>
          <p className="text-xs text-editorial-600 max-w-md font-medium leading-relaxed">
            Real-time telemetry from integrated parking garages. ESP32 infrared barrier sensors feed live occupancy state directly to the dual-agent bidding cluster.
          </p>
        </div>

        {/* Competing Lots Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {lots.map((lot) => {
            const lotSlots = slots.filter((s) => s.lot_id === lot.lot_id);
            const vacantCount = lotSlots.filter((s) => s.sensor_occupied === 0).length;
            const totalCount = lotSlots.length || 1;
            const occupancyPct = Math.round(((totalCount - vacantCount) / totalCount) * 100);

            return (
              <div
                key={lot.lot_id}
                className="fleet-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-editorial-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-editorial-800 text-white flex items-center justify-center font-bold text-xs">
                        {lot.lot_id.slice(-1)}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-editorial-800">{lot.name}</div>
                        <div className="text-[10px] text-editorial-500 font-mono flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-coral-500" />
                          <span>{lot.distance_m}m walk from destination</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-editorial-800">
                      ₹{Math.round(lot.base_list_paise / 100)}/hr
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-editorial-600">
                      <span>Occupancy</span>
                      <span className="font-mono">{occupancyPct}% Filled</span>
                    </div>
                    <div className="w-full bg-[#EAE6DE] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DFD9CE] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {vacantCount} Bays Available
                  </span>
                  <span className="text-editorial-500 font-mono text-[10px]">
                    Floor: ₹{Math.round(lot.base_floor_paise / 100)}/hr
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive AG Grid Bay Matrix & Physical Sensor Control */}
        <div className="fleet-card flex-1 min-h-[420px] mb-8">
          <AgGridDashboard
            lots={lots}
            slots={slots}
            onToggleSensor={handleToggleSlotSensor}
          />
        </div>

        {/* Hardware Bridge Telemetry Banner */}
        <div className="fleet-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-editorial-800 text-coral-500 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-editorial-800">
                ESP32 Hardware Twin &amp; MQTT Optical Beam
              </div>
              <div className="text-[11px] text-editorial-600 font-medium">
                Physical infrared sensor beam interrupts trigger instantaneous bay state updates in SQLite and AG Grid.
              </div>
            </div>
          </div>
          <button
            onClick={() => handleNavigate('hosts')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-editorial-800 hover:bg-editorial-900 text-white text-xs font-bold uppercase tracking-wider transition shadow-[0_2px_0_#0B1E2E] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <span>Proceed to Host Negotiation</span>
            <ArrowRight className="w-3.5 h-3.5 text-coral-500" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 3: HOSTS PAGE (#hosts)                                               */}
      {/* Dedicated full page for dual-agent bidding theater, driver console & chart*/}
      {/* ========================================================================= */}
      <section
        id="hosts"
        className="min-h-screen py-16 px-6 max-w-7xl w-full mx-auto border-t border-[#DFD9CE] flex flex-col justify-start"
      >
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-coral-600 uppercase mb-2">
              02 / Dual-Agent Bidding
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-editorial-800 tracking-tight uppercase">
              Host Operators &amp; Autonomous Theater
            </h2>
          </div>
          <p className="text-xs text-editorial-600 max-w-md font-medium leading-relaxed">
            The driver proxy negotiates against host facility agents. Live structured dialogue converges until an optimal Nash settlement is locked or floor limit is reached.
          </p>
        </div>

        {/* Main Grid: Left Driver Console & CTAs, Right Live Theater & Offer Ladder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Driver Constraints & Action Buttons (lg:col-span-4) */}
          <div className="host-panel lg:col-span-4 flex flex-col gap-5">
            {/* Driver Bidding Parameters */}
            <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DFD9CE]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-editorial-700" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-editorial-800">
                    Driver Constraints
                  </span>
                </div>
                <span className="text-[10px] font-mono text-coral-600 font-bold bg-coral-50 px-2 py-0.5 rounded-md border border-coral-200">
                  Private Policy
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Budget */}
                <div className="bg-white border border-[#DFD9CE] rounded-2xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-editorial-600 font-bold">Max Hourly Budget</span>
                    <span className="font-extrabold text-editorial-800 font-mono text-sm">
                      ₹{budgetRupees}/hr
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBudgetRupees((p) => Math.max(20, p - 2))}
                      className="w-7 h-7 rounded-full bg-ivory-100 hover:bg-ivory-200 flex items-center justify-center font-bold text-editorial-800 transition active:scale-95 cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={20}
                      max={70}
                      step={1}
                      value={budgetRupees}
                      onChange={(e) => setBudgetRupees(Number(e.target.value))}
                      className="w-full accent-coral-500 cursor-pointer"
                    />
                    <button
                      onClick={() => setBudgetRupees((p) => Math.min(80, p + 2))}
                      className="w-7 h-7 rounded-full bg-ivory-100 hover:bg-ivory-200 flex items-center justify-center font-bold text-editorial-800 transition active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-editorial-500 mt-1 flex justify-between">
                    <span>Floor: ₹20</span>
                    <span>Paise: {budgetRupees * 100}</span>
                  </div>
                </div>

                {/* Max Walk Distance */}
                <div className="bg-white border border-[#DFD9CE] rounded-2xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-editorial-600 font-bold">Max Walk Distance</span>
                    <span className="font-extrabold text-editorial-800 font-mono text-sm">
                      {maxDistance} meters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMaxDistance((p) => Math.max(100, p - 50))}
                      className="w-7 h-7 rounded-full bg-ivory-100 hover:bg-ivory-200 flex items-center justify-center font-bold text-editorial-800 transition active:scale-95 cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={100}
                      max={800}
                      step={50}
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="w-full accent-coral-500 cursor-pointer"
                    />
                    <button
                      onClick={() => setMaxDistance((p) => Math.min(1000, p + 50))}
                      className="w-7 h-7 rounded-full bg-ivory-100 hover:bg-ivory-200 flex items-center justify-center font-bold text-editorial-800 transition active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-editorial-500 mt-1 flex justify-between">
                    <span>Min: 100m</span>
                    <span>Walk Penalty: 2p/m</span>
                  </div>
                </div>

                {/* Duration & Prepay */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white border border-[#DFD9CE] rounded-2xl p-2.5 text-center shadow-2xs">
                    <div className="text-[10px] text-editorial-500 font-bold uppercase tracking-wider">Duration</div>
                    <div className="font-mono font-extrabold text-editorial-800 text-sm mt-0.5">
                      {hours} Hours
                    </div>
                  </div>
                  <label className="bg-white border border-[#DFD9CE] rounded-2xl p-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-2xs select-none">
                    <input
                      type="checkbox"
                      checked={prepay}
                      onChange={(e) => setPrepay(e.target.checked)}
                      className="rounded accent-coral-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-left">
                      <div className="text-[10px] font-extrabold text-editorial-800 leading-none">Prepaid</div>
                      <div className="text-[9px] text-emerald-600 font-bold">5% discount</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Tactile Action Command Center (Buttons with physical depth) */}
            <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              {winner ? (
                <button
                  onClick={() => handleOpenCheckout(winner)}
                  className="w-full bg-coral-500 hover:bg-coral-600 text-white font-black py-4 px-5 rounded-2xl text-xs flex items-center justify-center gap-2.5 uppercase tracking-wider transition-all duration-150 shadow-[0_4px_0_#BA371E] active:translate-y-1 active:shadow-none cursor-pointer ring-2 ring-coral-400/40"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open Vision Gate &amp; Show QR Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleStartNegotiation}
                  disabled={isPacing}
                  className="w-full bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white font-black py-4 px-5 rounded-2xl text-xs flex items-center justify-center gap-2.5 uppercase tracking-wider transition-all duration-150 shadow-[0_4px_0_#BA371E] active:translate-y-1 active:shadow-none cursor-pointer group"
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Start Autonomous Negotiation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={triggerReplay}
                  disabled={isPacing}
                  className="bg-editorial-800 hover:bg-editorial-900 disabled:opacity-50 text-white font-extrabold py-3 px-3 rounded-xl text-[11px] flex items-center justify-center gap-2 uppercase tracking-wider transition-all duration-150 shadow-[0_3px_0_#0B1E2E] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  title="Replays pre-recorded 22-event trace for offline zero-Wi-Fi hackathon demos"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-coral-500" />
                  <span>Offline Replay</span>
                </button>

                <button
                  onClick={clearEvents}
                  className="bg-white hover:bg-ivory-100 text-editorial-700 border border-[#DFD9CE] py-3 px-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-150 shadow-[0_2px_0_#DFD9CE] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  Clear Screen
                </button>
              </div>

              {/* Security Micro-Proof */}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-editorial-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Deterministic integer paise bounds strictly enforced.</span>
              </div>
            </div>

            {/* Deal Winner Notification Badge if locked */}
            {winner && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-5 animate-in zoom-in-95 duration-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Arbitrage Deal Locked!</span>
                </div>
                <div className="text-xs text-emerald-800 leading-relaxed">
                  Settled at <strong>₹{winner.agreed_rate_rupees}/hr</strong> with <strong>{winner.name}</strong>. Spot reserved for immediate check-in.
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Negotiation Theater & Offer Ladder Chart (lg:col-span-8) */}
          <div className="host-panel lg:col-span-8 flex flex-col gap-6">
            {/* The Live Dual-Agent Negotiation Theater */}
            <div className="min-h-[580px]">
              <NegotiationTheater
                events={events}
                winner={winner}
                onOpenCheckout={handleOpenCheckout}
                isPacing={isPacing}
                onStartTrigger={handleStartNegotiation}
                onReplayTrigger={triggerReplay}
              />
            </div>

            {/* Offer Ladder Convergence Chart */}
            <div className="h-[300px]">
              <OfferLadderChart events={events} />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 4: CONTACT PAGE (#contact)                                           */}
      {/* Dedicated page for host facility onboarding & driver key credentials     */}
      {/* ========================================================================= */}
      <section
        id="contact"
        className="min-h-screen py-16 px-6 max-w-7xl w-full mx-auto border-t border-[#DFD9CE] flex flex-col justify-start"
      >
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-coral-600 uppercase mb-2">
              03 / Contact &amp; Onboarding
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-editorial-800 tracking-tight uppercase">
              Host Inquiries &amp; Driver Support
            </h2>
          </div>
          <p className="text-xs text-editorial-600 max-w-md font-medium leading-relaxed">
            Connect your garage or private parking facility to the Parkos autonomous arbitrage network, or contact our automated gate dispatch center.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Host Facility Application Form (lg:col-span-7) */}
          <div className="contact-panel lg:col-span-7 bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#DFD9CE]">
              <Building2 className="w-5 h-5 text-editorial-800" />
              <div>
                <h3 className="text-sm font-extrabold text-editorial-800 uppercase tracking-wider">
                  Host Facility Application
                </h3>
                <p className="text-[11px] text-editorial-500 font-medium">
                  Connect your garage barriers to Parkos arbitrage API
                </p>
              </div>
            </div>

            {formSubmitted ? (
              <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-editorial-800 mb-1">
                  Inquiry Dispatched Successfully
                </h4>
                <p className="text-xs text-editorial-600 max-w-sm">
                  Our network operations engineers will inspect your facility specifications and deliver ESP32 firmware twins within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-editorial-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Vikram Malhotra"
                      className="w-full bg-white border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-editorial-800 outline-none focus:border-editorial-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-editorial-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="vikram@metro-parking.in"
                      className="w-full bg-white border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-editorial-800 outline-none focus:border-editorial-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-editorial-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                      Facility Name &amp; City
                    </label>
                    <input
                      type="text"
                      value={contactForm.facility}
                      onChange={(e) => setContactForm({ ...contactForm, facility: e.target.value })}
                      placeholder="e.g. Cyber City Basement P3, Gurugram"
                      className="w-full bg-white border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-editorial-800 outline-none focus:border-editorial-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-editorial-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                      Total Parking Bays
                    </label>
                    <select
                      value={contactForm.bays}
                      onChange={(e) => setContactForm({ ...contactForm, bays: e.target.value })}
                      className="w-full bg-white border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-editorial-800 outline-none focus:border-editorial-500 transition cursor-pointer"
                    >
                      <option value="10">10 – 25 bays (Micro Lot)</option>
                      <option value="50">25 – 100 bays (Commercial Plaza)</option>
                      <option value="250">100+ bays (Transit Hub / Mall)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-editorial-700 font-bold mb-1.5 uppercase tracking-wider text-[10px]">
                    Barrier Infrastructure &amp; Inquiries
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your current barrier servo or camera setup..."
                    className="w-full bg-white border border-[#DFD9CE] rounded-xl px-3.5 py-2.5 text-editorial-800 outline-none focus:border-editorial-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-editorial-800 hover:bg-editorial-900 text-white font-extrabold py-3.5 rounded-full text-xs flex items-center justify-center gap-2 uppercase tracking-wider shadow-[0_3px_0_#0B1E2E] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-coral-500" />
                  <span>Submit Host Facility Application</span>
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: Driver Identity & Gate Pass Session Card (lg:col-span-5) */}
          <div className="contact-panel lg:col-span-5 flex flex-col gap-5">
            <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#DFD9CE]">
                <User className="w-5 h-5 text-editorial-800" />
                <div>
                  <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider">
                    Driver Profile &amp; Cryptographic Key
                  </h3>
                  <p className="text-[10px] text-editorial-500 font-medium">
                    Authenticated vehicle credentials
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-editorial-600 font-bold">Driver Name</span>
                  <span className="font-extrabold text-editorial-800">John Abraham</span>
                </div>
                <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-editorial-600 font-bold">Vehicle</span>
                  <span className="font-mono text-editorial-800 font-bold">Tesla Model 3 (KA-01-MJ-4211)</span>
                </div>
                <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-editorial-600 font-bold">HMAC Signature Key</span>
                  <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> ACTIVE-SHA256
                  </span>
                </div>
                <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-editorial-600 font-bold">PayPal Sandbox</span>
                  <span className="font-bold text-coral-600">Connected &amp; Pre-Approved</span>
                </div>
              </div>

              <button
                onClick={() => setIsSignInOpen(true)}
                className="w-full mt-4 bg-white hover:bg-ivory-100 text-editorial-800 border border-[#DFD9CE] py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Inspect Driver Session
              </button>
            </div>

            {/* Emergency Gate Override & Hotline */}
            <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-6 shadow-xs">
              <div className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-2">
                Automated Gate Dispatch
              </div>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium mb-3">
                If physical servo barrier does not lift within 3 seconds of QR presentation, our edge daemon triggers fallback clearance via local MQTT.
              </p>
              <div className="text-xs font-mono font-bold text-editorial-700 bg-white border border-[#DFD9CE] p-2.5 rounded-xl text-center">
                Emergency Dispatch: +91 800-PARKOS-SOS
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* PAGE 5: ABOUT PAGE (#about) — THE LAST PAGE PER USER SPECIFICATION        */}
      {/* 7 Deterministic Anti-Hallucination Barriers, Math Proof & Architecture    */}
      {/* ========================================================================= */}
      <section
        id="about"
        className="min-h-screen py-16 px-6 max-w-7xl w-full mx-auto border-t border-[#DFD9CE] flex flex-col justify-between"
      >
        <div>
          {/* Section Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-coral-600 uppercase mb-2">
                04 / System Architecture (Final Proof)
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-editorial-800 tracking-tight uppercase">
                7 Deterministic Anti-Hallucination Barriers
              </h2>
            </div>
            <p className="text-xs text-editorial-600 max-w-md font-medium leading-relaxed">
              Parkos guarantees that LLM natural-language capabilities are strictly isolated from financial settlement and gate actuation through mathematical invariants.
            </p>
          </div>

          {/* 7 Deterministic Architectural Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            
            {/* Pillar 1 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">01</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                Integer Paise Precision
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                Eliminates floating-point arithmetic throughout the entire backend. All tariffs, bids, and fees are stored and computed strictly as integer paise (₹1 = 100 paise), preventing IEEE 754 rounding exploits.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">02</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                PolicyGuard Floor Bounds
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                Mathematical clamping layer sits between LLM output and state transition. No prompt injection or agent hallucination can force a lot to accept a bid beneath its immutable floor rate.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">03</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                Zero-LLM Payment Formulation
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                PayPal Orders v2 API request payloads are constructed solely from verified SQLite state records. LLMs never format financial transactions or set order amounts.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">04</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                HMAC-SHA256 Gate Passes
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                QR passes contain booking ID, timestamp, and an HMAC-SHA256 cryptographic signature. Passes expire after 15 minutes and cannot be replayed or forged.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">05</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                Physical Vision Gate Verification
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                An edge camera scans the QR pass using OpenCV and pyzbar. On cryptographic match, the daemon commands an SG90 servo motor to actuate the gate barrier 90°.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="pillar-card bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-5 shadow-xs hover:border-editorial-500/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-editorial-800 text-coral-500 flex items-center justify-center mb-3">
                <span className="font-mono font-black text-xs">06</span>
              </div>
              <h3 className="text-xs font-extrabold text-editorial-800 uppercase tracking-wider mb-1.5">
                Dual-Agent Gemini Engine
              </h3>
              <p className="text-[11px] text-editorial-600 leading-relaxed font-medium">
                Driver agent (Gemini 2.5 Flash) balances budget vs walking distance. Host agent (Gemini 2.5 Flash-Lite) optimizes yield based on real-time bay occupancy.
              </p>
            </div>

            {/* Pillar 7 */}
            <div className="pillar-card md:col-span-2 lg:col-span-3 bg-editorial-800 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-coral-500" />
                  <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-coral-300">
                    Pillar 07 / Hackathon Resilience
                  </span>
                </div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Deterministic Offline Fallback Engine
                </h4>
                <p className="text-xs text-editorial-100 max-w-2xl font-normal leading-relaxed">
                  Includes a pre-recorded 22-event golden negotiation trace replayable in 1200ms human pacing. Guarantees 100% demo resilience during live judging even under conference Wi-Fi failure or LLM rate limits.
                </p>
              </div>
              <button
                onClick={triggerReplay}
                className="shrink-0 bg-coral-500 hover:bg-coral-600 text-white font-black py-3 px-6 rounded-full text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_3px_0_#BA371E] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                Trigger Demo Replay
              </button>
            </div>

          </div>

          {/* Technology Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {['FastAPI Python 3.12', 'PayPal Orders v2', 'Gemini 2.5 Flash', 'React 18 + Vite', 'GSAP ScrollTrigger', 'Tailwind CSS', 'AG Grid Community', 'OpenCV Vision Gate', 'ESP32 MicroPython'].map((tech) => (
              <span
                key={tech}
                className="px-3.5 py-1 rounded-full bg-[#FAF8F5] border border-[#DFD9CE] text-[11px] font-mono font-bold text-editorial-700 shadow-2xs"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Minimal Editorial Footer (At the very bottom of About) */}
        <footer className="pt-6 border-t border-[#DFD9CE] flex flex-wrap items-center justify-between gap-4 text-xs text-editorial-600">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-editorial-800 tracking-tight uppercase text-xs">Parkos</span>
            <span className="text-[#DFD9CE]">|</span>
            <span className="font-medium text-[11px]">
              Dual-Agent Gemini Engine · Real-Time Parking Arbitrage
            </span>
          </div>

          <div className="flex items-center gap-6 font-bold tracking-widest uppercase text-[10px] text-editorial-600">
            <button onClick={() => handleNavigate('home')} className="hover:text-coral-500 transition cursor-pointer">
              Home
            </button>
            <button onClick={() => handleNavigate('fleets')} className="hover:text-coral-500 transition cursor-pointer">
              Fleets
            </button>
            <button onClick={() => handleNavigate('hosts')} className="hover:text-coral-500 transition cursor-pointer">
              Hosts
            </button>
            <button onClick={() => handleNavigate('contact')} className="hover:text-coral-500 transition cursor-pointer">
              Contact
            </button>
            <button onClick={() => setIs404Active(true)} className="hover:text-coral-500 transition cursor-pointer" title="Test 404">
              404
            </button>
          </div>

          <div className="text-editorial-500 font-medium text-[11px]">
            © {new Date().getFullYear()} Parkos Inc. All rights reserved.
          </div>
        </footer>
      </section>

      {/* PayPal Checkout & HMAC QR Pass Modal */}
      <QRPassModal
        winner={checkoutWinner}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Sign In Profile Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-50 bg-editorial-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-editorial-800 text-white flex items-center justify-center mx-auto mb-3">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-editorial-800 text-center mb-1">Driver Profile</h3>
            <p className="text-xs text-editorial-600 text-center mb-4">
              Authenticated as <span className="font-bold text-editorial-800">John Abraham (Tesla Model 3)</span>
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex justify-between items-center">
                <span className="text-editorial-600 font-medium">Session Token:</span>
                <span className="font-mono text-editorial-800 font-bold">HMAC-Active</span>
              </div>
              <div className="bg-white border border-[#DFD9CE] p-3 rounded-2xl flex justify-between items-center">
                <span className="text-editorial-600 font-medium">Wallet:</span>
                <span className="font-bold text-coral-600">PayPal Sandbox Connected</span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsSignInOpen(false);
                setToast({ type: 'success', message: 'Profile active and synchronized.' });
              }}
              className="w-full mt-4 bg-coral-500 hover:bg-coral-600 text-white font-bold py-2.5 rounded-full text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
