import json
import time
import logging
from typing import AsyncGenerator, Dict, Any

from state.debate_state import DebateState, AgentExecution
from services.gemini_service import GeminiService


logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# AGENT PERSONA CONFIG — used by customer_prompt.py
# ──────────────────────────────────────────────────────────────
CUSTOMER_AGENTS = {
    "positive_rep": {
        "name": "Rachel Park",
        "role": "Senior IT Director — Cloud Migrations",
        "experience_type": "positive",
        "bias": "Tends to emphasize what worked; may underweight friction that was temporary",
        "personality": "Enthusiastic but credible. Earned trust by delivering results. Knows the details because she lived through implementation.",
        "tone": "Confident, practical, uses specific examples. Avoids hype language.",
        "experience_lens": "Focuses on what enabled her team's success — tooling quality, support responsiveness, onboarding speed, and day-one productivity.",
    },
    "negative_rep": {
        "name": "David Okonkwo",
        "role": "VP of Engineering — Platform Infrastructure",
        "experience_type": "negative",
        "bias": "Anchored to failure experiences; may generalize from specific incidents",
        "personality": "Frustrated but professional. Has detailed recall of what went wrong and why. Doesn't exaggerate — he has evidence.",
        "tone": "Direct, measured anger. Uses incident timelines and business impact to back every claim.",
        "experience_lens": "Focuses on where things broke — SLA breaches, support failures, hidden complexity, migration delays, and the team cost of bad tooling.",
    },
    "neutral_rep": {
        "name": "Simone Laurent",
        "role": "Chief Architect — Enterprise Systems",
        "experience_type": "neutral",
        "bias": "Genuinely balanced; may frustrate executives who want a clear recommendation",
        "personality": "Analytical, contextual, good at explaining WHY the same vendor can produce different outcomes for different teams.",
        "tone": "Thoughtful, nuanced, explains conditions and context before conclusions.",
        "experience_lens": "Focuses on conditions for success — team maturity, use case fit, support tier selection, and scale thresholds where each vendor excels or struggles.",
    },
}


class CustomerAgent:
    """
    Customer Agent Execution Engine.

    Runs customer panel members (Positive, Negative, Neutral)
    who provide real-world vendor experience testimony.
    """

    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    # ---------------------------------------------------------
    # NON-STREAMING EXECUTION
    # ---------------------------------------------------------
    async def execute(
        self,
        state: DebateState,
        agent_id: str,
        round_number: int
    ) -> AgentExecution:

        started_at = time.time()

        try:
            prompt = self._build_prompt(
                state=state,
                agent_id=agent_id,
                round_number=round_number
            )

            raw_response = await self.gemini.generate_async(
                prompt=prompt,
                temperature=0.5,
                max_tokens=4000
            )

            parsed_output = self._safe_parse_json(raw_response)
            completed_at = time.time()

            return {
                "agent_id": agent_id,
                "round_number": round_number,
                "status": "completed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": raw_response,
                "parsed_output": parsed_output,
                "confidence_score": parsed_output.get("confidence", 0.0),
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": None
            }

        except Exception as e:
            logger.exception(f"CustomerAgent execution failed: {agent_id}")
            completed_at = time.time()

            return {
                "agent_id": agent_id,
                "round_number": round_number,
                "status": "failed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": "",
                "parsed_output": {},
                "confidence_score": 0.0,
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": str(e)
            }

    # ---------------------------------------------------------
    # STREAMING EXECUTION
    # ---------------------------------------------------------
    async def execute_stream(
        self,
        state: DebateState,
        agent_id: str,
        round_number: int
    ) -> AsyncGenerator[Dict[str, Any], None]:

        started_at = time.time()
        accumulated_response = ""

        try:
            prompt = self._build_prompt(
                state=state,
                agent_id=agent_id,
                round_number=round_number
            )

            yield {
                "event_type": "agent_started",
                "agent_type": "customer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": f"{agent_id} testimony started"
            }

            yield {
                "event_type": "agent_thinking",
                "agent_type": "customer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Recalling real-world vendor experience"
            }

            async for chunk in self.gemini.generate_stream_async(
                prompt=prompt,
                temperature=0.5,
                max_tokens=4000
            ):
                if not chunk:
                    continue

                accumulated_response += chunk

                yield {
                    "event_type": "agent_chunk",
                    "agent_type": "customer",
                    "agent_id": agent_id,
                    "round_number": round_number,
                    "timestamp": self._iso_timestamp(time.time()),
                    "content": chunk
                }

            parsed_output = self._safe_parse_json(accumulated_response)
            completed_at = time.time()

            execution_result: AgentExecution = {
                "agent_id": agent_id,
                "round_number": round_number,
                "status": "completed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": accumulated_response,
                "parsed_output": parsed_output,
                "confidence_score": parsed_output.get("confidence", 0.0),
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": None
            }

            yield {
                "event_type": "agent_completed",
                "agent_type": "customer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Testimony completed",
                "metadata": execution_result
            }

        except Exception as e:
            logger.exception(f"Streaming CustomerAgent failed: {agent_id}")
            completed_at = time.time()

            error_result: AgentExecution = {
                "agent_id": agent_id,
                "round_number": round_number,
                "status": "failed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": accumulated_response,
                "parsed_output": {},
                "confidence_score": 0.0,
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": str(e)
            }

            yield {
                "event_type": "agent_error",
                "agent_type": "customer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": str(e),
                "metadata": error_result
            }

    # ---------------------------------------------------------
    # INTERNAL HELPERS
    # ---------------------------------------------------------
    def _build_prompt(
        self,
        state: DebateState,
        agent_id: str,
        round_number: int
    ) -> str:
        from prompts.customer_prompt import build_customer_prompt
        intelligence = state.get("intelligence", {})

        return build_customer_prompt(
            agent_id=agent_id,
            round_num=round_number,
            intelligence=intelligence,
            debate_memory=state
        )

    def _safe_parse_json(self, raw_response: str) -> Dict[str, Any]:
        try:
            cleaned = raw_response.strip()

            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "")

            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            return json.loads(cleaned.strip())

        except Exception as e:
            logger.exception("Failed to parse customer agent JSON output")
            return {"parsing_error": str(e), "raw_output": raw_response}

    def _iso_timestamp(self, timestamp: float) -> str:
        from datetime import datetime
        return datetime.fromtimestamp(timestamp).isoformat()
