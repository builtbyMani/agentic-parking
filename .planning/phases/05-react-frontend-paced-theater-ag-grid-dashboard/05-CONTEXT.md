# Phase 5: React Frontend Paced Theater & AG Grid Dashboard - Context

**Gathered:** 2026-10-15
**Status:** In Planning

<domain>
## Phase Boundary

Construct the complete modern frontend in `frontend/` using Vite, React 18/19, TypeScript, TailwindCSS, Lucide-React, Recharts, and AG Grid Community:
1. `frontend/src/hooks/usePacedStream.ts`: 1200ms pacing queue buffering rapid WebSocket bursts for human readability, plus offline replay mode using `golden_runs.json`.
2. `frontend/src/components/NegotiationTheater.tsx`: Live animated chat theater with round markers, amber clamped badges (`[Adjusted to policy limit]`), model latency pills, and winning soft-lock banner.
3. `frontend/src/components/OfferLadderChart.tsx`: Real-time Recharts line visualization tracking price convergence across rounds for competing lots.
4. `frontend/src/components/AgGridDashboard.tsx`: Real-time parking inventory grid with `enableCellChangeFlash` flashing green on sensor changes and amber on price updates.
5. `frontend/src/components/QRPassModal.tsx`: PayPal Sandbox checkout link, confirmation handler, and SVG/canvas QR pass display with immediate gate presentation trigger.
6. `frontend/src/App.tsx`: Unified dashboard integrating negotiation controls, theater, offer ladder, live AG Grid, virtual hardware controls, and QR pass modal.

</domain>

<decisions>
## Implementation Decisions

### Pacing & Resiliency (FE-01, FE-02)
- **D-01:** `usePacedStream`: WebSocket delivers rounds in rapid bursts (~1.5s). The hook enqueues events and releases them every 1200ms to allow viewers to follow the dialogue and price adjustments.
- **D-02:** Golden runs replay: If WebSocket is disconnected or user clicks "Replay Offline Demo", loads `frontend/public/golden_runs.json` and feeds it through the same 1200ms pacing queue.

### Anti-Hallucination Transparency (FE-03)
- **D-03:** Clamped badges: If `guard_triggered == true`, displays an amber badge `⚠️ AMBER CLAMP: Clamped to policy limit` alongside the reasoning and model name (`gemini-3.8-flash` / `gemini-3.5-flash-lite`).
- **D-04:** Soft-lock timer: When a winner is declared, displays a 180s countdown timer indicating the slot reservation lock.

### Visualizations & Dashboard (FE-04, FE-05)
- **D-05:** Price ladder: Recharts `LineChart` showing round-by-round convergence toward the agreed rate.
- **D-06:** AG Grid Community: Strictly uses `ag-grid-community` and `ag-grid-react` (zero Enterprise watermarks). `enableCellChangeFlash: true` flashes cells dynamically on hardware/pricing updates.

</decisions>

<canonical_refs>
## Canonical References
- User Specification §2: Frontend directory layout
- User Specification §3: Step 8 (usePacedStream), Step 9 (NegotiationTheater & OfferLadderChart), Step 10 (AgGridDashboard)
- Roadmap Phase 5: Requirements FE-01 through FE-05

</canonical_refs>

---
*Phase: 05-react-frontend-paced-theater-ag-grid-dashboard*
*Context gathered: 2026-10-15*
