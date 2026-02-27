"""
Sprint Models
-------------
SQLAlchemy ORM model for the `sprints` table.

A Sprint belongs to a Project and represents a fixed time-box
during which a set of tasks is completed.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
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
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    project_id = Column(
        Uuid,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(
        Enum(SprintStatus, native_enum=False),
        nullable=False,
        default=SprintStatus.PLANNED,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    project = relationship("Project", back_populates="sprints")

    def __repr__(self):
        return f"<Sprint {self.name!r} ({self.status.value})>"
