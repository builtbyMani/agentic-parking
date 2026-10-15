import { useState, useEffect, useRef, useCallback } from 'react';
import { NegotiationEvent, LotPolicy, Slot, WinnerData, DriverConstraints } from '../types';

export function usePacedStream(paceMs: number = 1200) {
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<NegotiationEvent | null>(null);
  const [isPacing, setIsPacing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lots, setLots] = useState<LotPolicy[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [gateState, setGateState] = useState<string>('CLOSED');
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready');

  const queueRef = useRef<NegotiationEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Pacing ticker: Pops 1 event every paceMs from the buffer queue
  useEffect(() => {
    const timer = setInterval(() => {
      if (queueRef.current.length > 0) {
        const nextEvt = queueRef.current.shift()!;
        setEvents((prev) => [...prev, nextEvt]);
        setLatestEvent(nextEvt);
        setIsPacing(queueRef.current.length > 0);

        // Update domain state based on paced event
        if (nextEvt.event_type === 'WINNER_DECLARED') {
          setWinner(nextEvt.data.winner);
          setStatusText(`Winner Declared: ${nextEvt.data.winner.name}`);
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
        }
      } else {
        setIsPacing(false);
      }
    }, paceMs);

    return () => clearInterval(timer);
  }, [paceMs]);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatusText('Connected to Gateway');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatusText('Disconnected');
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
        } else if (
          evt.event_type === 'SLOT_SENSOR_CHANGED' ||
          evt.event_type === 'GATE_OPENED' ||
          evt.event_type === 'GATE_CLOSED'
        ) {
          // Immediately reflect hardware state changes without queue delay
          if (evt.event_type === 'GATE_OPENED') setGateState('OPEN');
          if (evt.event_type === 'GATE_CLOSED') setGateState('CLOSED');
          if (evt.event_type === 'SLOT_SENSOR_CHANGED') {
            setSlots((prev) =>
              prev.map((s) =>
                s.slot_id === evt.data.slot_id
                  ? { ...s, sensor_occupied: evt.data.occupied ? 1 : 0 }
                  : s
              )
            );
          }
          queueRef.current.push(evt);
          setIsPacing(true);
        } else {
          // Enqueue negotiation events into 1200ms pacing buffer
          queueRef.current.push(evt);
          setIsPacing(true);
        }
      } catch (err) {
        console.error('WS Parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Offline Replay Fallback (Zero-WiFi Demo Resiliency)
  const triggerReplay = useCallback(async () => {
    try {
      setStatusText('Loading Offline Golden Replay...');
      setEvents([]);
      setWinner(null);
      queueRef.current = [];

      const res = await fetch('/golden_runs.json');
      const data = await res.json();
      if (data && Array.isArray(data.events)) {
        queueRef.current = [...data.events];
        setIsPacing(true);
        setStatusText('Replaying Offline Golden Run (1200ms Paced)');
      }
    } catch (err) {
      console.error('Failed to load golden_runs.json:', err);
      setStatusText('Failed to load offline replay file');
    }
  }, []);

  // Launch live negotiation
  const startNegotiation = useCallback(async (constraints: DriverConstraints) => {
    try {
      setEvents([]);
      setWinner(null);
      queueRef.current = [];
      setStatusText('Dispatching Autonomous Negotiation...');

      const res = await fetch('http://localhost:8000/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(constraints),
      });
      const data = await res.json();
      setStatusText('Agents Bidding (1200ms Paced Theater)...');
      return data;
    } catch (err) {
      console.error('Negotiate error:', err);
      setStatusText('Negotiation request failed');
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
    queueRef.current = [];
    setWinner(null);
    setStatusText('Ready');
  }, []);

  return {
    events,
    latestEvent,
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
    setGateState,
  };
}
