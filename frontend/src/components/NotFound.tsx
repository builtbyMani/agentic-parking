import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';

interface NotFoundProps {
  onBackToHome: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-[#EAE6DE] flex flex-col items-center justify-center p-6 text-center">
      {/* Floating Pill Emblem Card */}
      <div className="bg-[#FAF8F5] border border-[#DFD9CE] rounded-3xl p-8 max-w-md w-full shadow-lg">
        {/* Parkos Sunburst Emblem */}
        <div className="w-16 h-16 rounded-full bg-editorial-800 text-white flex items-center justify-center mx-auto mb-5 shadow-md">
          <svg className="w-9 h-9 text-coral-500" viewBox="0 0 32 32" fill="none">
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

        <div className="inline-block bg-coral-50 border border-coral-200 text-coral-600 px-3 py-1 rounded-full text-xs font-mono font-bold mb-3">
          Error 404 · Bay Not Found
        </div>

        <h1 className="text-2xl font-extrabold text-editorial-800 tracking-tight mb-2">
          Lost in the Garage
        </h1>

        <p className="text-xs text-editorial-600 leading-relaxed mb-6 font-medium">
          The requested route does not exist on this autonomous parking cluster. Your vehicle has been safely redirected.
        </p>

        <button
          onClick={onBackToHome}
          className="w-full bg-coral-500 hover:bg-coral-600 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-coral-500/20 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Gateway Hub</span>
        </button>
      </div>

      <div className="text-[11px] text-editorial-500 mt-6 font-medium">
        © {new Date().getFullYear()} Parkos Inc. All rights reserved.
      </div>
    </div>
  );
};
