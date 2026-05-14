from sqlalchemy import Column, String, Boolean
from utils.db import SessionLocal
import uuid

from models.Intelligence import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String, default="Administrator")
    is_active = Column(Boolean, default=True)

# Create tables immediately (for sqlite/local dev convenience)
from utils.db import engine
Base.metadata.create_all(bind=engine)
