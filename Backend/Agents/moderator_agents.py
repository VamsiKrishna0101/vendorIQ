import json
import time
import logging
from typing import Dict, Any

from state.debate_state import DebateState, ModeratorState
from services.gemini_service import GeminiService


logger = logging.getLogger(__name__)


class ModeratorAgent:
    """
    Moderator Agent Execution Engine.

    The Moderator runs ONCE at the end of all debate rounds.
    It synthesizes all stakeholder, customer, and adversarial
    outputs into a single final vendor recommendation.

    No streaming — this is a deliberate final decision call.
    """

    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    # ---------------------------------------------------------
    # EXECUTE FINAL DECISION
    # ---------------------------------------------------------
    async def execute(
        self,
        state: DebateState
    ) -> ModeratorState:

        started_at = time.time()

        try:
            prompt = self._build_prompt(state=state)

            raw_response = await self.gemini.generate_async(
                prompt=prompt,
                temperature=0.2,   # Low temp — decisive, not creative
                max_tokens=6000
            )

            parsed_output = self._safe_parse_json(raw_response)
            completed_at = time.time()

            return {
                "status": "completed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": raw_response,
                "parsed_output": parsed_output,
                "confidence_score": parsed_output.get(
                    "decision_confidence", {}
                ).get("score", 0.0),
                "execution_time_seconds": round(
                    completed_at - started_at, 2
                ),
                "error": None
            }

        except Exception as e:
            logger.exception("ModeratorAgent execution failed")
            completed_at = time.time()

            return {
                "status": "failed",
                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),
                "raw_response": "",
                "parsed_output": {},
                "confidence_score": 0.0,
                "execution_time_seconds": round(
                    completed_at - started_at, 2
                ),
                "error": str(e)
            }

    # ---------------------------------------------------------
    # INTERNAL HELPERS
    # ---------------------------------------------------------
    def _build_prompt(self, state: DebateState) -> str:
        """
        Moderator prompt only needs the full debate_memory (state).
        No agent_id or round_number — it runs once at the end.
        """
        from prompts.moderator_prompt import build_moderator_prompt
        return build_moderator_prompt(debate_memory=state)

    def _safe_parse_json(self, raw_response: str) -> Dict[str, Any]:
        try:
            cleaned = raw_response.strip()

            if cleaned.startswith("```json"):
                cleaned = cleaned.replace("```json", "")

            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            return json.loads(cleaned.strip())

        except Exception as e:
            logger.exception("Failed to parse moderator JSON output")
            return {"parsing_error": str(e), "raw_output": raw_response}

    def _iso_timestamp(self, timestamp: float) -> str:
        from datetime import datetime
        return datetime.fromtimestamp(timestamp).isoformat()
