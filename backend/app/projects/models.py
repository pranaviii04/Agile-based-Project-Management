"""
Project Models
--------------
SQLAlchemy ORM model for the `projects` table.

A Project is the top-level container that holds sprints and tasks.
Each project is owned by a user and tracks its lifecycle status.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ProjectStatus(str, enum.Enum):
    """Lifecycle status of a project."""
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(ProjectStatus, native_enum=False),
        nullable=False,
        default=ProjectStatus.PLANNING,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    owner = relationship("User", back_populates="projects")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name!r} ({self.status.value})>"
