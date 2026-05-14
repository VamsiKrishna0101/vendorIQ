from sqlalchemy import Column, String, JSON, Float, Integer, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Intelligence(Base):
    __tablename__ = "intelligence"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    session_id   = Column(String, nullable=False) 
    analyst_type = Column(String(50), nullable=False)
    content      = Column(JSON)
    confidence   = Column(Float)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)