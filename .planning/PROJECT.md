# Agentic Parking Negotiation & IoT Gate System

## What This Is

An autonomous, multi-agent parking negotiation platform and physical IoT gate access system. A Driver AI agent negotiates bilateral hourly parking rates with multiple Parking Lot AI pricing agents under strict anti-hallucination barriers, settles payments via PayPal Sandbox, and issues cryptographically signed HMAC QR passes for physical servo gate access and IR slot occupancy verification.

## Core Value

Zero-hallucination, deterministic bilateral price negotiation and automated physical access control: LLMs generate conversational bidding strategy while pure mathematical guards and deterministic barriers strictly clamp prices, enforce monotonic convergence, sanitize contradictory prose, and control all financial and physical access primitives.

## Business Context

- **Customer**: Urban drivers seeking dynamic parking rates and parking lot operators maximizing yield during demand spikes.
- **Revenue model**: Transaction fee per completed booking + dynamic yield management for lot operators.
- **Success metric**: 100% policy invariant compliance across adversarial conditions and sub-second negotiation turn latency.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **7 Anti-Hallucination Barriers**: Response schema integer paise, policy floor/budget clamp, monotonicity enforcement, regex prose sanitizer, round-locked action state machine, memory-isolated prompts, zero-LLM payment calculation.
- [ ] **Dual-Bucket Gemini Client & Fallbacks**: Gemini 2.5 Flash for Driver agent, Gemini 2.5 Flash-Lite for Lot agents with rate-limit concurrency semaphore and deterministic mathematical concession fallback.
- [ ] **Deterministic Multi-Lot Orchestrator**: 3-round bilateral state machine with distance pre-filtering, atomic SQLite slot soft-locks, and utility-based winner selection.
- [ ] **PayPal Sandbox & HMAC QR Security**: Paise-to-USD conversion boundary, PayPal v2 checkout order creation, and tamper-proof SHA-256 HMAC signed QR pass generation/verification.
- [ ] **Webcam QR Vision & ESP32 Hardware Twin**: OpenCV cv2.QRCodeDetector deterministic scan, USB serial/WebSocket bridge, SG90 servo gate control, and IR obstacle slot sensors.
- [ ] **React Frontend Theater & Dashboard**: Vite React-TS with `usePacedStream` pacing queue, OfferLadderChart, and AG Grid Community with live cell change flashing.
- [ ] **50-Run Adversarial Fuzz Invariant Testing**: Exhaustive chaos test suite verifying 100% safety invariant pass rate.

### Out of Scope

- Floating-point currency representation (strictly integer paise internally).
- LLM-calculated payment totals or tax computation (handled strictly by Python runtime).
- LLM-based image decoding for QR scanning (strictly OpenCV deterministic detector).
- AG Grid Enterprise features (strictly AG Grid Community with zero watermarks).

## Context

- Negotiation participants: 1 Driver agent negotiating concurrently across up to 3 candidate parking lots (e.g., Lot A, Lot B, Lot C).
- Currency handling: All internal storage and calculation is done in integer paise (₹1 = 100 paise). PayPal boundary converts integer paise to USD cents based on fixed demo FX (`USD_TO_INR_PAISE=8400`).
- Hardware environment: ESP32 microcontroller with SG90 servo motor (barrier gate) and active-LOW IR obstacle sensors for parking slot occupancy detection.

## Constraints

- **Deterministic Financial Safety**: LLMs must never calculate monetary totals or manipulate order amounts.
- **Strict Anti-Hallucination**: PolicyGuard and regex prose sanitizer guarantee that displayed text matches numerical policy limits.
- **Latency & Reliability**: Free tier Gemini RPM quotas managed via dual-model bucket routing and immediate fallback to rule-based concession steps.
- **Zero-Dependency Hardware Resilience**: USB Serial fallback ensures demo works without depending on congested hackathon Wi-Fi.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integer paise for all money | Prevents floating point drift and currency discrepancies | — Pending |
| Pydantic `response_schema` token constraint | Forces Gemini to output schema-compliant JSON | — Pending |
| PolicyGuard clamps before state update | Ensures agents cannot breach floor or budget limits | — Pending |
| Regex Prose Sanitizer | Eliminates text-vs-number contradictions on UI | — Pending |
| Dual-model routing (Flash + Flash-Lite) | Avoids 429 quota exhaustion on free Gemini API tier | — Pending |
| OpenCV for QR detection | Eliminates LLM visual hallucination on QR codes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-10-15 after initialization*
