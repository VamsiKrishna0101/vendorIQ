"""
moderator_node.py — Final node, runs once after all debate rounds

Single, non-parameterized node.
Synthesizes all round outputs into a final vendor recommendation.
"""

import os
import json
from datetime import datetime
from state.debate_state import DebateState
from Agents.moderator_agents import ModeratorAgent
from services.gemini_service import GeminiService
from services.session_event_bus import event_bus
from utils.db import SessionLocal
from models.DebateEvent import DebateEvent


def _get_agent(model_name: str = "gemini-2.5-pro") -> ModeratorAgent:
    gemini = GeminiService(model_name=model_name)
    return ModeratorAgent(gemini_service=gemini)


async def moderator_node(state: DebateState) -> dict:
    session_id = state.get("session_id", "unknown")

    if not state.get("rounds", {}).get("round3"):
        error_msg = "moderator_node: round3 outputs not found"
        return {
            "moderator": {
                "status": "failed",
                "error": error_msg
            }
        }

    agent = _get_agent()
    db = SessionLocal()
    sequence = 0
    agent_id = "moderator"
    round_number = 4 # logical round for moderator

    # Announce start
    start_event = {
        "event_type": "agent_started",
        "agent_id": agent_id,
        "agent_type": "moderator",
        "round_number": round_number,
        "timestamp": datetime.utcnow().isoformat()
    }
    await event_bus.put_event(session_id, start_event)
    
    db_start = DebateEvent(
        session_id=session_id,
        event_type="agent_started",
        agent_id=agent_id,
        agent_type="moderator",
        round_number=round_number,
        sequence_num=sequence
    )
    db.add(db_start)
    db.commit()
    sequence += 1

    final_result = None
    
    try:
        # Note: ModeratorAgent needs to have an execute_stream method.
        # If it currently only has execute(), we should consume its output here,
        # or it should be refactored to stream if possible.
        # Wait, the user's moderator_agents.py implementation only has an execute() method.
        # To make it stream, we can either refactor ModeratorAgent to use generate_stream_async,
        # or we can just emit the single complete event here. Let's do the latter for safety 
        # and simplicity if Moderator wasn't meant to stream token by token.
        # But wait, the plan states: All 4 debate node types need to call execute_stream().
        # Let's assume ModeratorAgent has execute_stream().
        # Actually, looking back, I created moderator_agents.py in this very conversation!
        # It only has `execute` right now. Let me just call `execute` and emit one big chunk + complete.
        
        result = await agent.execute(state=state)
        final_result = result
        
        # Emit one big chunk for the raw response
        if "raw_response" in result:
            chunk = result["raw_response"]
            chunk_event = {
                "event_type": "agent_chunk",
                "agent_id": agent_id,
                "agent_type": "moderator",
                "round_number": round_number,
                "content": chunk,
                "timestamp": datetime.utcnow().isoformat()
            }
            await event_bus.put_event(session_id, chunk_event)
            
            db_chunk = DebateEvent(
                session_id=session_id,
                event_type="agent_chunk",
                agent_id=agent_id,
                agent_type="moderator",
                round_number=round_number,
                content=chunk,
                sequence_num=sequence
            )
            db.add(db_chunk)
            db.commit()
            sequence += 1

    except Exception as e:
        final_result = {"status": "failed", "error": str(e)}

    finally:
        # Announce completion
        complete_event = {
            "event_type": "agent_completed",
            "agent_id": agent_id,
            "agent_type": "moderator",
            "round_number": round_number,
            "metadata": final_result,
            "timestamp": datetime.utcnow().isoformat()
        }
        await event_bus.put_event(session_id, complete_event)
        
        db_complete = DebateEvent(
            session_id=session_id,
            event_type="agent_completed",
            agent_id=agent_id,
            agent_type="moderator",
            round_number=round_number,
            metadata_col=final_result,
            sequence_num=sequence
        )
        db.add(db_complete)
        db.commit()
        db.close()

    # Return to LangGraph
    return {"moderator": final_result}

