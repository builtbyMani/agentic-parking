import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { NegotiationEvent, LotPolicy, Slot, WinnerData, DriverConstraints } from '../types';
import { GOLDEN_EVENTS } from '../data/goldenRun';
import { INITIAL_LOTS, INITIAL_SLOTS } from '../data/mockLots';

// Automatic platform host detection for Expo (Android emulator uses 10.0.2.2, iOS / Web use localhost)
const getApiBase = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE = getApiBase();

export function useMobileNegotiation(paceMs: number = 1200) {
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<NegotiationEvent | null>(null);
  const [isPacing, setIsPacing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lots, setLots] = useState<LotPolicy[]>(INITIAL_LOTS);
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);
  const [gateState, setGateState] = useState<'OPEN' | 'CLOSED'>('CLOSED');
  const [gateCountdown, setGateCountdown] = useState<number>(0);
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready for autonomous bidding');

  const queueRef = useRef<NegotiationEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 1200ms Pacing ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const nextEvt = queueRef.current.shift()!;
        setEvents((prev) => [...prev, nextEvt]);
        setLatestEvent(nextEvt);
        setIsPacing(queueRef.current.length > 0);

        if (nextEvt.event_type === 'ACCEPT' || nextEvt.event_type === 'WINNER_DECLARED') {
          const d = nextEvt.data?.winner || nextEvt.data;
          if (d && (d.winner_lot_id || d.lot_id)) {
            const winnerData: WinnerData = {
              lot_id: d.winner_lot_id || d.lot_id,
              name: d.winner_name || d.name,
              slot_id: d.slot_id,
              agreed_rate_paise: d.agreed_rate_paise,
              agreed_rate_rupees: d.agreed_rate_rupees ?? Math.round(d.agreed_rate_paise / 100),
              total_paise: d.total_paise,
              total_rupees: d.total_rupees ?? Math.round(d.total_paise / 100),
              usd_cents: d.usd_cents,
              usd_display: `$${((d.usd_cents || 0) / 100).toFixed(2)}`,
              booking_id: d.booking_id,
            };
            setWinner(winnerData);
            setStatusText(`Locked: ${winnerData.name} (Slot ${winnerData.slot_id})`);
          }
        } else if (nextEvt.event_type === 'GATE_OPENED') {
          setGateState('OPEN');
        } else if (nextEvt.event_type === 'GATE_CLOSED') {
          setGateState('CLOSED');
        } else if (nextEvt.event_type === 'SLOT_SENSOR_CHANGED') {
          setSlots((prev) =>
            prev.map((s) =>
              s.slot_id === nextEvt.data.slot_id
                ? { ...s, sensor_occupied: nextEvt.data.occupied ? 1 : 0 }
                : s
            )
          );
        } else if (nextEvt.event_type === 'ROUND_COMPLETED') {
          setStatusText(`Round ${nextEvt.data.round} Completed`);
        } else if (nextEvt.event_type === 'NEGOTIATION_ERROR') {
          setStatusText(`Negotiation Error: ${nextEvt.data?.error || 'Failed'}`);
        }
      } else {
        setIsPacing(false);
      }
    }, paceMs);

    return () => clearInterval(timer);
  }, [paceMs]);

  // Connect to live backend WebSocket if reachable
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsUrl = API_BASE.replace('http', 'ws') + '/ws';
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onmessage = (msg) => {
        try {
          const evt: NegotiationEvent = JSON.parse(msg.data);
          if (evt.event_type === 'CONNECTED') {
            if (evt.data.lots) setLots(evt.data.lots);
            if (evt.data.slots) setSlots(evt.data.slots);
            if (evt.data.gate_state) setGateState(evt.data.gate_state);
          } else {
            queueRef.current.push(evt);
            setIsPacing(true);
          }
        } catch (e) {
          // Ignore non-json pongs
        }
      };
    } catch (err) {
      setIsConnected(false);
    }

    return () => {
      ws?.close();
    };
  }, []);

  // Offline Replay
  const triggerReplay = useCallback(() => {
    setEvents([]);
    setWinner(null);
    setQrToken(null);
    queueRef.current = [...GOLDEN_EVENTS];
    setIsPacing(true);
    setStatusText('Pacing Offline Golden Run (1200ms)...');
  }, []);

  // Start Autonomous Negotiation
  const startNegotiation = useCallback(async (constraints: DriverConstraints) => {
    setEvents([]);
    setWinner(null);
    setQrToken(null);
    queueRef.current = [];
    setStatusText('Contacting Multi-Lot Gemini Agents...');

    try {
      const res = await fetch(`${API_BASE}/api/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(constraints),
      });
      if (res.ok) {
        setStatusText('Live Agents Bidding (1200ms Paced)...');
      } else {
        // Fallback to offline replay if server offline
        triggerReplay();
      }
    } catch (err) {
      console.log('Server unreachable, launching local demo run:', err);
      triggerReplay();
    }
  }, [triggerReplay]);

  // Actuate Barrier Gate with 5s countdown
  const actuateGate = useCallback(async () => {
    setGateState('OPEN');
    setGateCountdown(5);

    try {
      await fetch(`${API_BASE}/api/gate/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: qrToken || 'DEMO_HMAC_TOKEN' }),
      });
    } catch (e) {
      // Local fallback
    }

    const interval = setInterval(() => {
      setGateCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setGateState('CLOSED');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [qrToken]);

  // Toggle slot occupancy
  const toggleSlotSensor = useCallback(async (slotId: string, currentOccupied: boolean) => {
    const nextOccupied = !currentOccupied;
    setSlots((prev) =>
      prev.map((s) => (s.slot_id === slotId ? { ...s, sensor_occupied: nextOccupied ? 1 : 0 } : s))
    );
    try {
      await fetch(`${API_BASE}/api/hardware/toggle-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, occupied: nextOccupied }),
      });
    } catch (e) {
      // Optimistic update retained
    }
  }, []);

  // Confirm payment and issue HMAC pass
  const confirmPayment = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: 'DEMO_MOBILE_ORDER' }),
      });
      const data = await res.json();
      if (data.qr_token) {
        setQrToken(data.qr_token);
        return data.qr_token;
      }
    } catch (e) {
      // Fallback client-signed token
      const dummyToken = `PASS_${bookingId}_LOT_C_C01_HMAC_${Date.now().toString(36).toUpperCase()}`;
      setQrToken(dummyToken);
      return dummyToken;
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    queueRef.current = [];
    setWinner(null);
    setQrToken(null);
    setStatusText('Ready for autonomous bidding');
  }, []);

  return {
    events,
    latestEvent,
    isPacing,
    isConnected,
    lots,
    slots,
    gateState,
    gateCountdown,
    winner,
    qrToken,
    statusText,
    startNegotiation,
    triggerReplay,
    clearEvents,
    actuateGate,
    toggleSlotSensor,
    confirmPayment,
    setWinner,
  };
}
