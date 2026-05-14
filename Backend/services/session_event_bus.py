import asyncio
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SessionEventBus:
    """
    Singleton in-memory event bus.
    Maps session_id -> asyncio.Queue.
    
    Nodes put streaming events into the queue.
    The SSE endpoint reads events from the queue and sends to frontend.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionEventBus, cls).__new__(cls)
            cls._instance.queues: Dict[str, asyncio.Queue] = {}
        return cls._instance

    def create_queue(self, session_id: str) -> asyncio.Queue:
        """Create a new event queue for a session."""
        if session_id not in self.queues:
            self.queues[session_id] = asyncio.Queue()
        return self.queues[session_id]

    def get_queue(self, session_id: str) -> asyncio.Queue:
        """Get an existing queue, or create it if missing."""
        return self.create_queue(session_id)

    async def put_event(self, session_id: str, event: Dict[str, Any]):
        """Put an event onto the queue."""
        queue = self.get_queue(session_id)
        await queue.put(event)

    async def complete_session(self, session_id: str):
        """Send the sentinel event indicating the debate is fully finished."""
        queue = self.get_queue(session_id)
        await queue.put({"event_type": "debate_completed"})

    def cleanup(self, session_id: str):
        """Remove the queue from memory once the SSE connection closes."""
        if session_id in self.queues:
            del self.queues[session_id]
            logger.info(f"Cleaned up event queue for session {session_id}")

# Export a single instance to be shared across the backend
event_bus = SessionEventBus()
