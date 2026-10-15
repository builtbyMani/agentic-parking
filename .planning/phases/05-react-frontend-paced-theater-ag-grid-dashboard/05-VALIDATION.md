---
phase: "5"
slug: "react-frontend-paced-theater-ag-grid-dashboard"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-15"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript Compiler (`tsc`) + Vite Build |
| **Config file** | `frontend/tsconfig.json` & `frontend/vite.config.ts` |
| **Quick run command** | `cd frontend && npx tsc --noEmit` |
| **Full suite command** | `cd frontend && npm run build` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx tsc --noEmit`
- **After every plan wave:** Run `cd frontend && npm run build`
- **Before completion:** Full build must produce `frontend/dist/` with 0 errors
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 05-01-01 | 01 | 1 | FE-01 | T-05-01 | React Vite & AG Grid Community dependencies | install | `cd frontend && npm list ag-grid-community` | ✅ yes | ✅ green |
| 05-01-02 | 01 | 1 | FE-02 | T-05-02 | usePacedStream pacing queue & replay loader | unit | `cd frontend && npx tsc --noEmit` | ✅ yes | ✅ green |
| 05-02-01 | 02 | 2 | FE-03 | T-05-03 | NegotiationTheater amber clamps & winner card | visual | `cd frontend && npx tsc --noEmit` | ✅ yes | ✅ green |
| 05-02-02 | 02 | 2 | FE-04 | T-05-04 | OfferLadderChart & QR pass modal | visual | `cd frontend && npx tsc --noEmit` | ✅ yes | ✅ green |
| 05-03-01 | 03 | 3 | FE-05 | T-05-05 | AgGridDashboard Community with cell flashing | visual | `cd frontend && npx tsc --noEmit` | ✅ yes | ✅ green |
| 05-03-02 | 03 | 3 | FE-01..05 | T-05-06 | Full Vite production bundle verification | build | `cd frontend && npm run build` | ✅ yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/package.json`
- [ ] `frontend/src/types.ts`
- [ ] `frontend/src/hooks/usePacedStream.ts`
- [ ] `frontend/src/components/NegotiationTheater.tsx`
- [ ] `frontend/src/components/OfferLadderChart.tsx`
- [ ] `frontend/src/components/QRPassModal.tsx`
- [ ] `frontend/src/components/AgGridDashboard.tsx`
- [ ] `frontend/src/App.tsx`

---

## Validation Sign-Off

- [x] All tasks have automated verify commands
- [x] No Enterprise watermarks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-15
