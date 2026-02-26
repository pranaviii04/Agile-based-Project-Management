"""
Project Model
--------------
SQLAlchemy ORM model for the `projects` table.

A Project is the top-level container that holds sprints and tasks.
Uses UUID as the primary key for better distributed-system compatibility.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, Uuid
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name!r} (id={self.id})>"
