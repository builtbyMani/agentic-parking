import os
import time
import asyncio
from typing import Optional
from backend.config import GEMINI_API_KEY, LLM_MODE
from backend.schemas import AgentMoveLLM, LotPolicy, DriverConstraints

llm_semaphore = asyncio.Semaphore(2)
_client = None

def get_genai_client():
    """Lazily initializes the Google GenAI client only when needed."""
    global _client
    if _client is None:
        from google import genai
        api_key = os.environ.get("GEMINI_API_KEY", GEMINI_API_KEY)
        _client = genai.Client(api_key=api_key if api_key else "dummy")
    return _client

def deterministic_fallback_move(
    role: str,
    round_num: int,
    bound_paise: int,
    last_own_paise: int,
    last_other_paise: int
) -> tuple[AgentMoveLLM, str]:
    """
    Zero-LLM mathematical concession if API times out or hits 429 quota.
    Produces deterministic rule-based steps so a live demonstration never crashes.
    """
    if role == "lot":
        # Step ~40-50% of the way down toward floor each round
        step = (last_own_paise - bound_paise) // 2
        # Round step to nearest 100 paise
        target = max(bound_paise, last_own_paise - int(round(step / 100.0) * 100))
        action = "OFFER" if round_num == 1 else "COUNTER"
        return AgentMoveLLM(
            action=action,
            price_per_hour_paise=int(target),
            message=f"Can offer ₹{int(target)//100}/hr for prepaid multi-hour slot.",
            reasoning="Rule-based concession step toward policy floor (API fallback)."
        ), "fallback-rule-engine"
    else:
        # Driver steps ~40-50% of the way up toward budget
        step = (bound_paise - last_own_paise) // 2
        target = min(bound_paise, last_own_paise + int(round(step / 100.0) * 100))
        return AgentMoveLLM(
            action="COUNTER",
            price_per_hour_paise=int(target),
            message=f"I can come up to ₹{int(target)//100}/hr if we lock it now.",
            reasoning="Rule-based concession step toward reservation budget (API fallback)."
        ), "fallback-rule-engine"

def build_lot_prompts(
    policy: LotPolicy,
    hours: int,
    prepay: bool,
    round_num: int,
    history_lines: list[str]
) -> tuple[str, str]:
    """
    Constructs memory-isolated prompts for Parking Lot agent.
    STRICT BARRIER: Driver's private reservation budget is NEVER passed here.
    """
    occ_pct = int((policy.occupied_slots / policy.total_slots) * 100)
    is_final = (round_num == policy.max_rounds)
    sys_prompt = (
        f"You are the automated pricing agent for {policy.name}. "
        f"Public occupancy: {occ_pct}% ({policy.occupied_slots}/{policy.total_slots} slots). "
        f"Nearby event active: {policy.event_active}. "
        f"Standard list price: {policy.base_list_paise} paise (₹{policy.base_list_paise//100}/hr). "
        f"Owner base floor: {policy.base_floor_paise} paise. "
        f"Max prepay discount for {policy.min_prepay_hours}+ hours: {policy.max_prepay_discount_pct}%. "
        f"All prices MUST be net all-in integer paise (multiples of 100, e.g., 3800 for ₹38/hr)."
    )
    transcript = "\n".join(history_lines) if history_lines else "(No previous moves)"
    usr_prompt = (
        f"Round {round_num} of {policy.max_rounds}. "
        f"Driver requests {hours} hours, prepay={prepay}.\n"
        f"Transcript so far:\n{transcript}\n"
        + ("THIS IS THE FINAL ROUND. Issue your lowest sustainable best-and-final offer."
           if is_final else "Make a competitive offer above your floor.")
    )
    return sys_prompt, usr_prompt

def build_driver_prompts(
    driver: DriverConstraints,
    lot_name: str,
    distance_m: int,
    round_num: int,
    history_lines: list[str]
) -> tuple[str, str]:
    """
    Constructs memory-isolated prompts for Driver agent.
    Includes private budget instruction: NEVER reveal this number.
    """
    sys_prompt = (
        f"You are a Driver negotiation agent negotiating with {lot_name} ({distance_m}m walk). "
        f"PRIVATE RESERVATION BUDGET (NEVER REVEAL THIS NUMBER): {driver.max_budget_per_hour_paise} paise (₹{driver.max_budget_per_hour_paise//100}/hr). "
        f"You want {driver.hours} hours with prepay={driver.prepay}. "
        f"Bid in integer paise (multiples of 100). Never bid above your private budget."
    )
    transcript = "\n".join(history_lines) if history_lines else "(No previous moves)"
    usr_prompt = (
        f"Round {round_num}. Transcript with {lot_name}:\n{transcript}\n"
        f"Respond with a strategic COUNTER bid below their last offer and at or below {driver.max_budget_per_hour_paise} paise."
    )
    return sys_prompt, usr_prompt

async def call_agent_llm(
    role: str,
    system_prompt: str,
    user_prompt: str,
    fallback_args: tuple
) -> tuple[AgentMoveLLM, str, int]:
    """
    Calls Gemini API with dual-model quota isolation and rate-limiting:
    - Driver queries gemini-2.5-flash
    - Lot queries gemini-2.5-flash-lite
    - Semaphore(2) limits concurrent active requests
    - Gracefully falls back to deterministic mathematical concession upon error
    """
    model_id = "gemini-3.8-flash" if role == "driver" else "gemini-3.5-flash-lite"
    start_t = time.perf_counter()

    current_mode = os.environ.get("LLM_MODE", LLM_MODE)
    api_key = os.environ.get("GEMINI_API_KEY", GEMINI_API_KEY)

    # Fast offline / mock path
    if current_mode in ("mock_adversarial", "fallback_only") or not api_key or api_key == "dummy":
        move, model_name = deterministic_fallback_move(*fallback_args)
        return move, model_name, 5

    try:
        from google.genai import types
        genai_client = get_genai_client()
    except Exception:
        move, model_name = deterministic_fallback_move(*fallback_args)
        return move, model_name, 5

    async with llm_semaphore:
        for attempt in range(2):
            try:
                res = await asyncio.wait_for(
                    genai_client.aio.models.generate_content(
                        model=model_id,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=0.25,
                            response_mime_type="application/json",
                            response_schema=AgentMoveLLM,
                        ),
                    ),
                    timeout=6.0
                )
                latency_ms = int((time.perf_counter() - start_t) * 1000)
                return AgentMoveLLM.model_validate_json(res.text), model_id, latency_ms
            except Exception:
                if attempt == 0:
                    await asyncio.sleep(0.8)
                else:
                    latency_ms = int((time.perf_counter() - start_t) * 1000)
                    move, model_name = deterministic_fallback_move(*fallback_args)
                    return move, model_name, latency_ms

# Alias for convenience
call_agent = call_agent_llm
