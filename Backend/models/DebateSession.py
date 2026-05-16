from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from datetime import datetime

# Import the existing Base from the first model to keep everything on the same metadata registry
from models.Intelligence import Base

class DebateSession(Base):
    """
    Stores metadata for a full multi-round debate session.
    """
    __tablename__ = "debate_sessions"

    session_id   = Column(String, primary_key=True)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    status       = Column(String(50), nullable=False, default="pending") 
    vendor_names = Column(JSONB, nullable=False) # e.g. ["AWS", "GCP", "Azure"]
    buyer_context = Column(JSONB, nullable=True) # Industry, size, requirements, etc.
    
    created_at   = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
