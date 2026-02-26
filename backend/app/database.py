"""
Database Configuration
----------------------
Creates the SQLAlchemy engine, session factory, and declarative Base.
Other modules import `Base` to define models and `get_db` as a
FastAPI dependency to obtain a database session per request.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Detect if we're using SQLite (needs special connect args)
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(settings.DATABASE_URL, echo=False)

# Session factory — each call produces a new session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class — all ORM models inherit from this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session.
    The session is automatically closed after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
