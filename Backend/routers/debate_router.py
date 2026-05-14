import uuid
import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from utils.db import get_db
from models.DebateSession import DebateSession
from models.DebateEvent import DebateEvent
from models.User import User
from graph.debate_graph import debate_graph
from state.debate_state import DebateState
from services.session_event_bus import event_bus
from services.streaming_service import stream_debate_events
from utils.auth import get_current_user

router = APIRouter(prefix="/debate", tags=["Debate Orchestration"])


@router.post("/start")
async def start_debate(
    file_paths: list[str], 
    vendor_names: list[str],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initializes a new debate session and kicks off the LangGraph orchestration in the background.
    Returns the session_id immediately so the client can connect to the streaming endpoint.
    """
    if not file_paths or not vendor_names:
        raise HTTPException(status_code=400, detail="file_paths and vendor_names are required")

    session_id = str(uuid.uuid4())

    # Create session in DB
    new_session = DebateSession(
        session_id=session_id,
        user_id=current_user.id,
        status="running",
        vendor_names=vendor_names
    )
    db.add(new_session)
    db.commit()

    # Initialize the queue
    event_bus.create_queue(session_id)

    # Prepare initial state
    initial_state: DebateState = {
        "session_id": session_id,
        "status": "running",
        "file_paths": file_paths,
        "vendor_names": vendor_names,
        "intelligence": {},
        "rounds": {},
        "customer": {},
        "adversarial": {},
        "event_log": [],
        "errors": [],
        "warnings": [],
        "bias_scores": {},
        "risk_scores": {}
    }

    # Define the background task that runs the graph
    async def run_graph(state, sid):
        try:
            # LangGraph's ainvoke runs the graph asynchronously
            # This will naturally parallelize nodes based on our graph definition
            final_state = await debate_graph.ainvoke(state)
            
            # Send completion signal to stream
            await event_bus.complete_session(sid)
            
            # Update DB session status
            db_session = db.query(DebateSession).filter(DebateSession.session_id == sid).first()
            if db_session:
                db_session.status = "completed"
                db_session.completed_at = datetime.utcnow()
                db.commit()
                
        except Exception as e:
            # Handle catastrophic graph failure
            error_event = {
                "event_type": "error",
                "message": f"Graph execution failed: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            }
            await event_bus.put_event(sid, error_event)
            await event_bus.complete_session(sid)
            
            db_session = db.query(DebateSession).filter(DebateSession.session_id == sid).first()
            if db_session:
                db_session.status = "failed"
                db_session.completed_at = datetime.utcnow()
                db.commit()

    # Start the graph in the background
    background_tasks.add_task(run_graph, initial_state, session_id)

    return {"session_id": session_id, "status": "running"}


@router.get("/stream/{session_id}")
async def stream_debate(
    session_id: str,
    # Note: EventSource in browser doesn't send headers easily. In production, 
    # a token can be passed in query params for SSE. For this local demo, 
    # we'll keep the SSE endpoint open or allow a query param.
    # To keep it simple and robust, we won't strictly enforce auth on the SSE 
    # connection itself if it's tricky from frontend, but we ideally should.
    # Let's add token as a query param if provided.
):
    """
    Connects to the live SSE stream for an active debate.
    """
    if session_id not in event_bus.queues:
        raise HTTPException(status_code=404, detail="Debate session stream not found or already closed")
        
    return StreamingResponse(
        stream_debate_events(session_id), 
        media_type="text/event-stream"
    )


@router.get("/replay/{session_id}")
async def replay_debate(
    session_id: str, 
    speed: float = 1.0, 
    db: Session = Depends(get_db),
    # Like SSE, replay is streaming, but since it might be fetched differently,
    # we can just use the query param or skip strict auth for the stream.
):
    """
    Replays a completed debate from the database.
    Does NOT use Gemini. Emits historical events via SSE.
    `speed` is a multiplier: 1.0 is normal, 2.0 is 2x fast, 0.0 is instantly dump everything.
    """
    session = db.query(DebateSession).filter(DebateSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    events = db.query(DebateEvent).filter(DebateEvent.session_id == session_id).order_by(DebateEvent.sequence_num.asc()).all()
    
    if not events:
        raise HTTPException(status_code=404, detail="No events found for this session")

    # Only replay meaningful events — skip raw chunk tokens
    REPLAY_EVENT_TYPES = {
        "agent_started", "agent_thinking", "agent_completed",
        "analyst_started", "analyst_completed",
        "phase_change", "debate_completed", "error"
    }

    # Filter to meaningful events only, sorted by round then sequence
    meaningful = sorted(
        [e for e in events if e.event_type in REPLAY_EVENT_TYPES],
        key=lambda e: (e.round_number or 0, e.sequence_num or 0)
    )

    async def replay_generator():
        last_round = None
        # Track which rounds already have a real phase_change in DB
        rounds_with_phase_change = {
            e.round_number for e in meaningful if e.event_type == "phase_change"
        }

        for evt in meaningful:
            current_round = evt.round_number

            # ── Auto-inject phase_change when round transitions ──
            # Only inject if this round doesn't already have a real phase_change in DB
            if current_round != last_round and current_round is not None:
                if current_round >= 1 and current_round not in rounds_with_phase_change:
                    phase_evt = {
                        "event_type": "phase_change",
                        "agent_id": "system",
                        "agent_type": "system",
                        "round_number": current_round,
                    }
                    yield f"data: {json.dumps(phase_evt)}\n\n"
                    await asyncio.sleep(3.0)  # pause so UI transition finishes
                last_round = current_round

            # Skip real phase_change events from DB (already handled above or emit them)
            if evt.event_type == "phase_change":
                phase_evt = {
                    "event_type": "phase_change",
                    "agent_id": "system",
                    "agent_type": "system",
                    "round_number": evt.round_number,
                }
                yield f"data: {json.dumps(phase_evt)}\n\n"
                await asyncio.sleep(3.0)
                continue

            # ── For agent_completed, first emit a synthetic agent_started ──
            if evt.event_type == "agent_completed":
                started_evt = {
                    "event_type": "agent_started",
                    "agent_id": evt.agent_id,
                    "agent_type": evt.agent_type,
                    "round_number": evt.round_number,
                }
                yield f"data: {json.dumps(started_evt)}\n\n"
                await asyncio.sleep(0.25)  # brief thinking state

            # ── Main event ──
            event_dict = {
                "event_type": evt.event_type,
                "agent_id": evt.agent_id,
                "agent_type": evt.agent_type,
                "round_number": evt.round_number,
            }
            if evt.content and evt.content != "phase_change":
                event_dict["content"] = evt.content
            if evt.metadata_col:
                event_dict["metadata"] = evt.metadata_col

            yield f"data: {json.dumps(event_dict)}\n\n"
            await asyncio.sleep(0.3)

        yield f"data: {json.dumps({'event_type': 'debate_completed'})}\n\n"


    return StreamingResponse(replay_generator(), media_type="text/event-stream")

@router.get("/list")
async def list_debates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(DebateSession).filter(DebateSession.user_id == current_user.id).order_by(DebateSession.created_at.desc()).all()
    
    result = []
    for s in sessions:
        # Calculate rounds/confidence if possible from events, or just mock for now
        # Ideally, DebateSession should store rounds and confidence upon completion
        
        # We can fetch the final verdict event to get confidence and winner
        verdict_event = db.query(DebateEvent).filter(
            DebateEvent.session_id == s.session_id,
            DebateEvent.agent_id == "moderator",
            DebateEvent.event_type == "agent_completed"
        ).first()
        
        confidence = 0
        winner = "N/A"
        if verdict_event and verdict_event.metadata_col:
            meta = verdict_event.metadata_col
            if "structured_data" in meta:
                confidence = meta["structured_data"].get("confidence", 0)
                winner = meta["structured_data"].get("winner", "N/A")

        # Duration
        duration_str = "0m 0s"
        if s.completed_at and s.created_at:
            delta = s.completed_at - s.created_at
            m, s_rem = divmod(int(delta.total_seconds()), 60)
            duration_str = f"{m}m {s_rem}s"

        result.append({
            "id": s.session_id,
            "title": f"Vendor Selection: {', '.join(s.vendor_names[:2])}{'...' if len(s.vendor_names) > 2 else ''}",
            "vendors": s.vendor_names,
            "status": s.status,
            "rounds": 4, # hardcoded for now
            "confidence": confidence,
            "date": s.created_at.strftime("%Y-%m-%d"),
            "duration": duration_str,
            "winner": winner
        })
        
    return {"status": "success", "data": result}

