"""
analyst_node.py — Round 0

Generic stateless node.
Processes uploaded vendor documents via ExtractData service.
Populates state["intelligence"] with all 5 analyst outputs.
"""

import os
from datetime import datetime
from state.debate_state import DebateState
from services.extract_data_service import ExtractData
from services.session_event_bus import event_bus
from utils.db import SessionLocal


async def analyst_node(state: DebateState) -> dict:
    session_id   = state.get("session_id", "unknown")
    file_paths   = state.get("file_paths", [])
    vendor_names = state.get("vendor_names", [])

    if not file_paths:
        return {
            "intelligence": {},
            "errors": ["analyst_node: no file_paths found in state"]
        }

    db = SessionLocal()

    # Announce start
    start_event = {
        "event_type": "analyst_started",
        "agent_id": "analyst_layer",
        "agent_type": "analyst",
        "round_number": 0,
        "timestamp": datetime.utcnow().isoformat()
    }
    await event_bus.put_event(session_id, start_event)

    try:
        extractor = ExtractData(db=db)

        result = await extractor.extract_data(
            path_lists=file_paths,
            vendor_names=vendor_names,
            session_id=session_id
        )

        intelligence = result.get("intelligence", {})

        return {"intelligence": intelligence}

    except Exception as e:
        return {
            "intelligence": {},
            "errors": [f"analyst_node failed: {str(e)}"]
        }

    finally:
        # Announce completion
        complete_event = {
            "event_type": "analyst_completed",
            "agent_id": "analyst_layer",
            "agent_type": "analyst",
            "round_number": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
        await event_bus.put_event(session_id, complete_event)
        
        # Trigger UI transition to Phase 1 (Round 1) and save to DB
        phase_change_event = {
            "event_type": "phase_change",
            "round_number": 1,
            "timestamp": datetime.utcnow().isoformat()
        }
        await event_bus.put_event(session_id, phase_change_event)
        
        # Save phase_change to DB for replay
        from models.DebateEvent import DebateEvent
        db_event = DebateEvent(
            session_id=session_id,
            event_type="phase_change",
            agent_id="system",
            agent_type="system",
            round_number=1,
            content="phase_change",
            sequence_num=9999
        )
        db.add(db_event)
        db.commit()
        
        db.close()
