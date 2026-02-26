"""
Sprint Models
-------------
SQLAlchemy ORM model for the `sprints` table.

A Sprint belongs to a Project and represents a fixed time-box
during which a set of tasks is completed.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.database import Base


class SprintStatus(str, enum.Enum):
    """Lifecycle status of a sprint."""
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    goal = Column(Text, nullable=True)
    project_id = Column(Uuid, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        Enum(SprintStatus, native_enum=False),
        nullable=False,
        default=SprintStatus.PLANNING,
    )
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ─────────────────────────────────────────
    project = relationship("Project", back_populates="sprints")

    def __repr__(self):
        return f"<Sprint {self.name!r} ({self.status.value})>"
