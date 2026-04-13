"""
Database Configuration
----------------------
Sets up the SQLAlchemy engine, session factory, and declarative Base
for a PostgreSQL database (hosted on Supabase).

Other modules:
  - Import `Base` to define ORM models.
  - Use `get_db` as a FastAPI dependency to get a DB session per request.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# create_engine() sets up the connection to PostgreSQL using the URL from config.
#
# pool_pre_ping=True  — tests each connection before using it, so stale/dropped
#                       connections from Supabase are automatically refreshed.
# echo=False          — set to True temporarily if you need to see raw SQL queries.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

# ── Session Factory ───────────────────────────────────────────────────────────
# sessionmaker() creates a factory that produces new database sessions.
#
# autocommit=False — we commit manually after successful operations.
# autoflush=False  — we flush manually; prevents unexpected queries mid-request.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Declarative Base ──────────────────────────────────────────────────────────
# All ORM model classes (User, Project, Sprint, Task, ...) inherit from Base.
# SQLAlchemy uses Base.metadata to know which tables exist and how to create them.
Base = declarative_base()


# ── FastAPI Dependency ────────────────────────────────────────────────────────
def get_db():
    """
    Yields a database session for the duration of a single HTTP request.

    Usage in a router:
        @router.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...

    The `finally` block ensures the session is always closed — even if the
    request handler raises an exception — so connections are returned to the pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
