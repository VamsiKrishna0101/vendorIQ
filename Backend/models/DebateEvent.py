from sqlalchemy import Column, String, JSON, DateTime, Integer, ForeignKey, Text
from datetime import datetime

from models.Intelligence import Base

class DebateEvent(Base):
    """
    Stores individual streaming events and final outputs for offline replay.
    Every chunk of text emitted by an agent is stored here with a sequence number.
    """
    __tablename__ = "debate_events"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    session_id   = Column(String, ForeignKey("debate_sessions.session_id"), nullable=False)
    
    event_type   = Column(String(50), nullable=False) # agent_started, agent_chunk, agent_completed
    agent_id     = Column(String(50), nullable=False) # cfo, cto, positive_rep
    agent_type   = Column(String(50), nullable=False) # decision, customer, adversarial, moderator
    round_number = Column(Integer, nullable=False)    # 0, 1, 2, 3
    
    content      = Column(Text, nullable=True)        # The actual token string or full message
    metadata_col = Column(JSON, nullable=True)        # Renamed to avoid reserved keyword conflicts, stores AgentExecution on complete
    
    sequence_num = Column(Integer, nullable=False)    # Crucial for maintaining order during replay
    
    created_at   = Column(DateTime, default=datetime.utcnow)
