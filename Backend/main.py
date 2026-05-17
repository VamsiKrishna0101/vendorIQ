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
origins = [
    "https://vendor-iq-jxmx-2u53whn80-vamsikrishnas-projects-eb5a338b.vercel.app",
    "https://vendor-iq-jxmx.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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
