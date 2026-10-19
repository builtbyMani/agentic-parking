import React, { useState } from 'react';
import { Menu, X, DoorOpen, DoorClosed, Wifi, WifiOff, KeyRound } from 'lucide-react';

export type SectionId = 'home' | 'fleets' | 'hosts' | 'contact' | 'about';

interface NavbarProps {
  activeSection: SectionId;
  gateState: string;
  isConnected: boolean;
  onNavigate: (section: SectionId) => void;
  onSignInClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  gateState,
  isConnected,
  onNavigate,
  onSignInClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { id: SectionId; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'fleets', label: 'Fleets' },
    { id: 'hosts', label: 'Hosts' },
    { id: 'contact', label: 'Contact' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="w-full border-b border-[#DFD9CE] bg-[#FAF8F5]/95 backdrop-blur-md sticky top-0 z-40 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Clickable Editorial Logo (Parkos Gear Emblem) */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3.5 group cursor-pointer text-left focus:outline-none"
          aria-label="Parkos Home"
        >
          {/* Custom Sunburst Gear Emblem */}
          <div className="w-8 h-8 rounded-full bg-editorial-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
            <svg className="w-4.5 h-4.5 text-coral-500" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#112E46" />
              <circle cx="16" cy="16" r="5" fill="#FAF8F5" />
              <g fill="#EF5537">
                <circle cx="16" cy="6" r="2" />
                <circle cx="21" cy="7.34" r="2" />
                <circle cx="24.66" cy="11" r="2" />
                <circle cx="26" cy="16" r="2" />
                <circle cx="24.66" cy="21" r="2" />
                <circle cx="21" cy="24.66" r="2" />
                <circle cx="16" cy="26" r="2" />
                <circle cx="11" cy="24.66" r="2" />
                <circle cx="7.34" cy="21" r="2" />
                <circle cx="6" cy="16" r="2" />
                <circle cx="7.34" cy="11" r="2" />
                <circle cx="11" cy="7.34" r="2" />
              </g>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base md:text-lg font-black text-editorial-800 tracking-tight uppercase leading-none">
              Parkos
            </span>
            <span className="text-[10px] md:text-[11px] font-mono tracking-widest text-editorial-500 uppercase font-bold mt-0.5">
              Arbitrage Engine
            </span>
          </div>
        </button>

        {/* Center: Editorial Navigation Links with Increased Prominent Font Size */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm lg:text-[15px] font-bold tracking-[0.12em] text-editorial-700 uppercase">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative py-1.5 transition-colors duration-150 focus:outline-none cursor-pointer ${
                  isActive ? 'text-editorial-900 font-black' : 'text-editorial-600 hover:text-coral-500'
                }`}
              >
                <span>{item.label}</span>
                {/* Active Dot matching Reference Design */}
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-coral-500 shadow-xs animate-in zoom-in-75 duration-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry Chips & Tactile Driver Key Button */}
        <div className="flex items-center gap-3.5">
          {/* Subtle Live Gate Badge */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold font-mono border transition-colors ${
              gateState === 'OPEN'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-400/20 animate-pulse'
                : 'bg-white border-[#DFD9CE] text-editorial-700'
            }`}
          >
            {gateState === 'OPEN' ? (
              <DoorOpen className="w-4 h-4 text-emerald-600" />
            ) : (
              <DoorClosed className="w-4 h-4 text-editorial-400" />
            )}
            <span>GATE: {gateState}</span>
          </div>

          {/* Minimalist Tactile Driver Key Button */}
          <button
            onClick={onSignInClick}
            className="hidden sm:inline-flex items-center gap-2 bg-editorial-800 hover:bg-editorial-900 text-white rounded-full px-5 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-150 shadow-[0_2px_0_#0B1E2E] active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-coral-500" />
            <span>Driver Key</span>
          </button>

          {/* Minimalist Hamburger Button for Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 rounded-full bg-white border border-[#DFD9CE] flex items-center justify-center text-editorial-800 hover:bg-ivory-100 transition-all active:scale-95 cursor-pointer shadow-2xs md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3.5 bg-white/98 backdrop-blur-md border border-[#DFD9CE] rounded-3xl p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 text-sm font-bold tracking-wider uppercase text-editorial-700">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left py-2.5 px-3.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-ivory-100 text-coral-600 font-black'
                      : 'hover:bg-ivory-50 text-editorial-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-coral-500" />}
                </button>
              );
            })}

            <div className="border-t border-[#DFD9CE] pt-3.5 mt-1 flex items-center justify-between text-xs text-editorial-600">
              <span className="flex items-center gap-1.5 font-sans lowercase">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-rose-500" />
                )}
                {isConnected ? 'daemon connected' : 'daemon offline'}
              </span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="text-coral-600 font-bold underline cursor-pointer"
              >
                Driver Key
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
