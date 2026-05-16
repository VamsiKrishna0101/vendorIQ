"""
adversarial_node.py — Runs after each debate round

Generic stateless node for ALL adversarial auditors.
"""

import os
import json
from datetime import datetime
from state.debate_state import DebateState
from Agents.adversial_agents import AdversarialAgent
from services.gemini_service import GeminiService
from services.session_event_bus import event_bus
from utils.db import SessionLocal
from models.DebateEvent import DebateEvent


def _get_agent(model_name: str = "gemini-2.5-flash-lite") -> AdversarialAgent:
    gemini = GeminiService(model_name=model_name)
    return AdversarialAgent(gemini_service=gemini)


def make_adversarial_node(agent_id: str, round_number: int):
    async def node(state: DebateState) -> dict:
        session_id = state.get("session_id", "unknown")
        
        if not state.get("intelligence"):
            error_msg = f"adversarial_node [{agent_id}, round {round_number}]: intelligence not found"
            return {"errors": [error_msg]}

        round_key = f"round{round_number}"

        if round_number > 1 and not state.get("rounds", {}).get(round_key):
            error_msg = f"adversarial_node [{agent_id}, round {round_number}]: {round_key} outputs not found"
            return {"errors": [error_msg]}

        # Adversarial agents always use the high-precision 'Pro' model for auditing
        agent = _get_agent()
        db = SessionLocal()
        sequence = 0
        final_result = None
        
        try:
            # Consume stream of event dictionaries
            async for event_dict in agent.execute_stream(state, agent_id, round_number):
                event_type = event_dict.get("event_type")
                
                if event_type == "agent_completed":
                    final_result = event_dict.get("metadata")
                elif event_type == "agent_error":
                    final_result = event_dict.get("metadata")
                
                # Send to stream
                await event_bus.put_event(session_id, event_dict)
                
                # Ensure content is string for DB
                content_val = event_dict.get("content", "")
                if isinstance(content_val, dict):
                    content_val = json.dumps(content_val)

                # Save to DB
                db_event = DebateEvent(
                    session_id=session_id,
                    event_type=event_type,
                    agent_id=event_dict.get("agent_id", agent_id),
                    agent_type="adversarial",
                    round_number=event_dict.get("round_number", round_number),
                    content=content_val,
                    metadata_col=event_dict.get("metadata"),
                    sequence_num=sequence
                )
                db.add(db_event)
                db.commit()
                sequence += 1

            if not final_result:
                final_result = {"status": "failed", "error": "Stream ended without final result"}

        except Exception as e:
            final_result = {"status": "failed", "error": str(e)}

        finally:
            db.close()

        # Return to LangGraph
        return {
            "adversarial": {
                agent_id: final_result
            }
        }

    node.__name__ = f"adversarial_node_{agent_id}_r{round_number}"
    return node
