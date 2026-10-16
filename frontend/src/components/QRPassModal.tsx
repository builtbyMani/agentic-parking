import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { WinnerData } from '../types';
import { X, ExternalLink, ShieldCheck, QrCode, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface CheckoutData {
  order_id?: string;
  approve_url?: string;
  usd_cents?: number;
  [key: string]: unknown;
}

interface QRPassModalProps {
  winner: WinnerData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({ winner, isOpen, onClose }) => {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [gateFeedback, setGateFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiBase = typeof window !== 'undefined' && window.location.port === '5173' ? '' : 'http://localhost:8000';

  // Load checkout session upon open
  useEffect(() => {
    if (isOpen && winner) {
      setQrToken(null);
      setGateFeedback(null);
      setErrorMessage(null);
      setLoading(true);
      fetch(`${apiBase}/api/bookings/${winner.booking_id}/checkout`, {
        method: 'POST',
      })
        .then((res) => res.json())
        .then((data) => {
          setCheckoutData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Checkout error:', err);
          setLoading(false);
        });
    }
  }, [isOpen, winner, apiBase]);

  // Auto-detect approval if completed in PayPal browser tab
  useEffect(() => {
    if (!isOpen || !winner || qrToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/slots`);
        const slots = await res.json();
        const slot = slots.find((s: any) => s.slot_id === winner.slot_id);
        if (slot && slot.booking_status === 'CONFIRMED') {
          const confRes = await fetch(`${apiBase}/api/bookings/${winner.booking_id}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: checkoutData?.order_id }),
          });
          const confData = await confRes.json();
          if (confData.qr_token) {
            setQrToken(confData.qr_token);
            setErrorMessage(null);
          }
        }
      } catch (e) {
        // Silently continue
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, winner, qrToken, apiBase, checkoutData]);

  if (!isOpen || !winner) return null;

  // Confirm booking & retrieve signed HMAC QR pass
  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch(`${apiBase}/api/bookings/${winner.booking_id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: checkoutData?.order_id }),
      });
      const data = await res.json();
      if (res.ok && data.qr_token) {
        setQrToken(data.qr_token);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.detail || 'Payment capture failed. Complete PayPal approval first.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Confirm error:', err);
      setErrorMessage('Failed to connect to confirmation API');
      setLoading(false);
    }
  };

  // Present pass to vision gate API
  const handlePresentToGate = async () => {
    if (!qrToken) return;
    try {
      setGateFeedback('Scanning QR pass at security gate...');
      const res = await fetch(`${apiBase}/api/gate/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: qrToken }),
      });
      const data = await res.json();
      if (data.valid && data.status === 'ACCESS_GRANTED') {
        setGateFeedback('ACCESS GRANTED! Servo barrier opened (5-sec auto-close window).');
      } else if (data.status === 'COOLDOWN_ACTIVE') {
        setGateFeedback(`Pass Valid! Gate recently actuated (${data.message}).`);
      } else {
        setGateFeedback(`Access Denied: ${data.reason}`);
      }
    } catch (err) {
      console.error('Gate presentation error:', err);
      setGateFeedback('Failed to reach gate scanner API');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <QrCode className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Parking Reservation Pass</h2>
        </div>

        {/* Reservation Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-white text-base">{winner.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Booking ID: {winner.booking_id}</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded">
              Slot {winner.slot_id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80 mt-2">
            <div>
              <span className="text-slate-400">Agreed Rate:</span>
              <p className="font-semibold text-white">₹{winner.agreed_rate_rupees}/hr</p>
            </div>
            <div>
              <span className="text-slate-400">Total Settlement:</span>
              <p className="font-semibold text-emerald-400">
                ₹{winner.total_rupees} ({winner.usd_display} USD)
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: PayPal Checkout */}
        {!qrToken ? (
          <div className="space-y-4">
            <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4 text-xs text-sky-200">
              <div className="flex items-center gap-2 font-bold text-sky-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-LLM Financial Boundary (PayPal v2 Sandbox)</span>
              </div>
              <p>
                Calculated strictly in Python: total integer paise is converted to USD cents (${winner.usd_display}) with 0 float drift.
              </p>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-sm animate-pulse">
                Setting up secure PayPal Sandbox session...
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {checkoutData?.approve_url && (
                  <a
                    href={checkoutData.approve_url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition active:scale-95"
                  >
                    <span>Approve on PayPal Sandbox</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={handleConfirmPayment}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Payment & Issue Signed QR Pass</span>
                </button>

                {errorMessage && (
                  <div className="bg-rose-950/70 border border-rose-700 text-rose-200 text-xs p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Digital Access QR Pass */
          <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-emerald-500">
              <QRCodeSVG value={qrToken} size={180} level="M" />
            </div>

            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cryptographic HMAC-SHA256 Signed Pass</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono break-all px-2">
                Token: {qrToken.substring(0, 32)}...
              </p>
            </div>

            <button
              onClick={handlePresentToGate}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Present to Physical Vision Gate</span>
            </button>

            {gateFeedback && (
              <div
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-center border ${
                  gateFeedback.includes('GRANTED')
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                    : gateFeedback.includes('cooldown') || gateFeedback.includes('Valid')
                    ? 'bg-amber-950/70 border-amber-600 text-amber-200'
                    : 'bg-rose-950/70 border-rose-600 text-rose-200'
                }`}
              >
                {gateFeedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
