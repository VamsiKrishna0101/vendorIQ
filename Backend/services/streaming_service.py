import asyncio
import json
import logging
from typing import AsyncGenerator
from services.session_event_bus import event_bus

logger = logging.getLogger(__name__)

async def stream_debate_events(session_id: str) -> AsyncGenerator[str, None]:
    """
    Reads events from the SessionEventBus queue and yields them as 
    Server-Sent Events (SSE) format strings.
    """
    queue = event_bus.get_queue(session_id)
    
    try:
        while True:
            # Wait for the next event in the queue
            # Added a timeout to send keep-alive pings if agents are thinking for a long time
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15.0)
            except asyncio.TimeoutError:
                # Send a keep-alive comment so the browser connection doesn't drop
                yield ": keepalive\n\n"
                continue

            # Check for the sentinel that ends the debate
            if event.get("event_type") == "debate_completed":
                yield f"data: {json.dumps(event)}\n\n"
                break
                
            # Yield the actual event formatted for SSE
            yield f"data: {json.dumps(event)}\n\n"
            
    except asyncio.CancelledError:
        logger.info(f"Streaming connection cancelled for session {session_id}")
        raise
    except Exception as e:
        logger.error(f"Error streaming events for session {session_id}: {e}")
        yield f"data: {json.dumps({'event_type': 'error', 'message': str(e)})}\n\n"
    finally:
        # We don't cleanup the queue here because multiple clients might be listening,
        # or the graph might still be running and trying to write to it if the client disconnected early.
        # Queue cleanup should ideally happen after the graph finishes.
        pass
