import json
import time
import logging
from typing import AsyncGenerator, Dict, Any, Optional

from state.debate_state import DebateState, AgentExecution
from services.gemini_service import GeminiService


logger = logging.getLogger(__name__)


# DECISION_AGENTS moved to prompts/decision_prompt.py to prevent circular import


class DecisionAgent:
    """
    Enterprise-grade Buyer Agent Execution Engine

    Responsibilities:
    - Build decision prompts
    - Stream LLM responses
    - Parse structured JSON outputs
    - Return standardized AgentExecution objects

    This class is intentionally:
    - stateless
    - reusable
    - async-first
    - orchestration-agnostic
    """

    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service

    # ---------------------------------------------------------
    # PUBLIC EXECUTION ENTRYPOINT
    # ---------------------------------------------------------
    async def execute(
        self,
        state: DebateState,
        agent_id: str,
        round_number: int
    ) -> AgentExecution:
        """
        Non-streaming execution.

        Used for:
        - testing
        - retries
        - fallback execution
        """

        started_at = time.time()

        try:
            prompt = self._build_prompt(
                state=state,
                agent_id=agent_id,
                round_number=round_number
            )

            raw_response = await self.gemini.generate_async(
                prompt=prompt,
                temperature=0.4,
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

                "confidence_score": parsed_output.get(
                    "confidence",
                    0.0
                ),

                "execution_time_seconds": round(
                    completed_at - started_at,
                    2
                ),

                "error": None
            }

        except Exception as e:
            logger.exception(
                f"BuyerAgent execution failed: {agent_id}"
            )

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

                "execution_time_seconds": round(
                    completed_at - started_at,
                    2
                ),

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
        """
        Streaming execution.

        Emits:
        - lifecycle events
        - token chunks
        - completion events

        Final event includes parsed AgentExecution.
        """

        started_at = time.time()

        accumulated_response = ""

        try:

            # -------------------------------------------------
            # BUILD PROMPT
            # -------------------------------------------------
            prompt = self._build_prompt(
                state=state,
                agent_id=agent_id,
                round_number=round_number
            )

            # -------------------------------------------------
            # START EVENT
            # -------------------------------------------------
            yield {
                "event_type": "agent_started",
                "agent_type": "buyer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": f"{agent_id} started analysis"
            }

            # -------------------------------------------------
            # THINKING EVENT
            # -------------------------------------------------
            yield {
                "event_type": "agent_thinking",
                "agent_type": "buyer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Analyzing intelligence and stakeholder context"
            }

            # -------------------------------------------------
            # STREAM TOKENS
            # -------------------------------------------------
            async for chunk in self.gemini.generate_stream_async(
                prompt=prompt,
                temperature=0.4,
                max_tokens=4000
            ):

                if not chunk:
                    continue

                accumulated_response += chunk

                yield {
                    "event_type": "agent_chunk",
                    "agent_type": "buyer",
                    "agent_id": agent_id,
                    "round_number": round_number,
                    "timestamp": self._iso_timestamp(time.time()),
                    "content": chunk
                }

            # -------------------------------------------------
            # PARSE FINAL OUTPUT
            # -------------------------------------------------
            parsed_output = self._safe_parse_json(
                accumulated_response
            )

            completed_at = time.time()

            execution_result: AgentExecution = {
                "agent_id": agent_id,
                "round_number": round_number,
                "status": "completed",

                "started_at": self._iso_timestamp(started_at),
                "completed_at": self._iso_timestamp(completed_at),

                "raw_response": accumulated_response,
                "parsed_output": parsed_output,

                "confidence_score": parsed_output.get(
                    "confidence",
                    0.0
                ),

                "execution_time_seconds": round(
                    completed_at - started_at,
                    2
                ),

                "error": None
            }

            # -------------------------------------------------
            # COMPLETION EVENT
            # -------------------------------------------------
            yield {
                "event_type": "agent_completed",
                "agent_type": "buyer",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Execution completed",
                "metadata": execution_result
            }

        except Exception as e:

            logger.exception(
                f"Streaming BuyerAgent failed: {agent_id}"
            )

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

                "execution_time_seconds": round(
                    completed_at - started_at,
                    2
                ),

                "error": str(e)
            }

            yield {
                "event_type": "agent_error",
                "agent_type": "buyer",
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
        """
        Build enterprise decision prompt.
        """
        from prompts.decision_prompt import build_decision_prompt
        intelligence = state.get("intelligence", {})

        return build_decision_prompt(
            agent_id=agent_id,
            round_num=round_number,
            intelligence=intelligence,
            debate_memory=state
        )

    # ---------------------------------------------------------
    # SAFE JSON PARSER
    # ---------------------------------------------------------
    def _safe_parse_json(
        self,
        raw_response: str
    ) -> Dict[str, Any]:
        """
        Safely parse LLM JSON outputs.
        """

        try:
            cleaned = raw_response.strip()

            if cleaned.startswith("```json"):
                cleaned = cleaned.replace(
                    "```json",
                    ""
                )

            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            cleaned = cleaned.strip()

            return json.loads(cleaned)

        except Exception as e:

            logger.exception(
                "Failed to parse agent JSON output"
            )

            return {
                "parsing_error": str(e),
                "raw_output": raw_response
            }

    # ---------------------------------------------------------
    # TIMESTAMP HELPER
    # ---------------------------------------------------------
    def _iso_timestamp(
        self,
        timestamp: float
    ) -> str:

        from datetime import datetime

        return datetime.fromtimestamp(
            timestamp
        ).isoformat()