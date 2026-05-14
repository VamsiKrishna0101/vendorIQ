import json
import time
import logging
from typing import AsyncGenerator, Dict, Any

from state.debate_state import DebateState, AgentExecution
from services.gemini_service import GeminiService


logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# AGENT PERSONA CONFIG — used by adversial_prompt.py
# ──────────────────────────────────────────────────────────────
ADVERSARIAL_AGENTS = {
    "devils_advocate": {
        "name": "Victor Crane",
        "role": "Devil's Advocate — Logical Stress Tester",
        "goal": "Expose weak assumptions and unsupported claims in stakeholder reasoning",
        "bias": "Contrarian by design — challenges all consensus regardless of direction",
        "personality": "Ruthlessly logical, relentless, finds the flaw in every argument. Enjoys being the one who asks the uncomfortable question.",
        "tone": "Sharp, incisive, unapologetic. Never softens critique.",
        "audit_style": "Targets the weakest link in any argument chain. Looks for overconfidence, unsupported claims, and dangerous consensus forming too quickly.",
    },
    "bias_detector": {
        "name": "Dr. Aisha Osei",
        "role": "Cognitive Bias Analyst",
        "goal": "Detect and quantify reasoning bias across all stakeholder agents",
        "bias": "Methodologically neutral — biased only toward objective reasoning",
        "personality": "Precise, academic, pattern-recognition focused. Sees bias where others see conviction.",
        "tone": "Clinical, evidence-driven, uses behavioral language to describe reasoning patterns.",
        "audit_style": "Tracks reasoning trajectories across rounds. Scores each agent's bias level and flags hidden preferences revealed through language and selective evidence use.",
    },
    "governance": {
        "name": "Margaret Hollis",
        "role": "Governance & Compliance Auditor",
        "goal": "Ensure all decisions comply with regulatory requirements and contractual standards",
        "bias": "Compliance-first — will block any decision with unresolved regulatory exposure",
        "personality": "Meticulous, uncompromising on standards, institutional in perspective. Has seen too many costly compliance failures.",
        "tone": "Formal, authoritative, references specific frameworks and requirements by name.",
        "audit_style": "Cross-references all stakeholder claims against documented compliance intelligence. Flags violations, gaps, and governance red flags that must be resolved before proceeding.",
    },
}


class AdversarialAgent:
    """
    Adversarial Agent Execution Engine.

    Runs audit agents (Devil's Advocate, Bias Detector, Governance)
    that challenge the integrity of stakeholder reasoning.
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
                temperature=0.3,
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
                "confidence_score": parsed_output.get("severity_score", 0.0),
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": None
            }

        except Exception as e:
            logger.exception(f"AdversarialAgent execution failed: {agent_id}")
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
                "agent_type": "adversarial",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": f"{agent_id} audit started"
            }

            yield {
                "event_type": "agent_thinking",
                "agent_type": "adversarial",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Analyzing stakeholder arguments for flaws and bias"
            }

            async for chunk in self.gemini.generate_stream_async(
                prompt=prompt,
                temperature=0.3,
                max_tokens=4000
            ):
                if not chunk:
                    continue

                accumulated_response += chunk

                yield {
                    "event_type": "agent_chunk",
                    "agent_type": "adversarial",
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
                "confidence_score": parsed_output.get("severity_score", 0.0),
                "execution_time_seconds": round(completed_at - started_at, 2),
                "error": None
            }

            yield {
                "event_type": "agent_completed",
                "agent_type": "adversarial",
                "agent_id": agent_id,
                "round_number": round_number,
                "timestamp": self._iso_timestamp(time.time()),
                "content": "Audit completed",
                "metadata": execution_result
            }

        except Exception as e:
            logger.exception(f"Streaming AdversarialAgent failed: {agent_id}")
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
                "agent_type": "adversarial",
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
        from prompts.adversial_prompt import build_adversarial_prompt
        intelligence = state.get("intelligence", {})

        return build_adversarial_prompt(
            agent_id=agent_id,
            round_num=round_number,
            debate_memory=state,
            intelligence=intelligence
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
            logger.exception("Failed to parse adversarial agent JSON output")
            return {"parsing_error": str(e), "raw_output": raw_response}

    def _iso_timestamp(self, timestamp: float) -> str:
        from datetime import datetime
        return datetime.fromtimestamp(timestamp).isoformat()
