"""
FastAPI Application Entry Point
-------------------------------
Creates the app, includes routers, and creates DB tables on startup.
Run with:  uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth
from app.projects.router import router as projects_router
from app.sprints.router import router as sprints_router
from app.tasks.router import router as tasks_router
from app.cpm.router import router as cpm_router

# Import all models so Base.metadata knows about them
from app.models import user as _user_model          # noqa: F401
from app.projects import models as _project_model   # noqa: F401
from app.sprints import models as _sprint_model     # noqa: F401
from app.tasks import models as _task_model           # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once on startup: creates all database tables if they
    don't already exist (good for development).
    In production you'd use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Agile Project Management System",
    description="Academic Agile PM tool with CPM integration",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS (allow Angular frontend to talk to this API) ────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(projects_router)
app.include_router(sprints_router)
app.include_router(tasks_router)
app.include_router(cpm_router)


# ── Health Check ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health_check():
    """Simple health-check endpoint."""
    return {"status": "ok", "message": "Agile PM API is running"}
