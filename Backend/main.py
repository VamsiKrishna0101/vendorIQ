from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils.db import engine
from models.Intelligence import Base
from routers.upload_router import router as upload_router
from routers.debate_router import router as debate_router
from routers.auth_router import router as auth_router

# Initialize database models
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VendorIQ Debate Engine",
    description="Multi-agent executive committee debate orchestration API",
    version="1.0.0"
)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(debate_router)

@app.get("/")
def read_root():
    return {"message": "VendorIQ Backend is running. Use /docs to explore the API."}
