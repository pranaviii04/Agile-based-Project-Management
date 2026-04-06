"""
Task & Dependency Models
------------------------
SQLAlchemy ORM models for the `tasks` and `task_dependencies` tables.

A Task belongs to a Sprint and optionally assigned to a User.
TaskDependency stores predecessor relationships between tasks
within the same sprint, enabling CPM analysis.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum,
    ForeignKey,
    UniqueConstraint,
    Uuid,
    Index,
)
from sqlalchemy.orm import relationship

from app.database import Base


class TaskStatus(str, enum.Enum):
    """Lifecycle status of a task."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Task(Base):
    __tablename__ = "tasks"

    __table_args__ = (
        Index("idx_task_sprint_id", "sprint_id"),
        Index("idx_task_assigned_to", "assigned_to"),
        Index("idx_task_status", "status"),
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False)
    priority = Column(Integer, nullable=False, default=1)
    status = Column(
        Enum(TaskStatus, native_enum=False),
        nullable=False,
        default=TaskStatus.TODO,
    )
    sprint_id = Column(
        Uuid,
        ForeignKey("sprints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_to = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────
    sprint = relationship("Sprint", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])

    # Dependencies where THIS task depends on others (predecessors)
    dependencies = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan",
    )
    # Dependencies where OTHER tasks depend on this one (successors)
    dependents = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.depends_on_task_id",
        back_populates="depends_on_task",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Task {self.name!r} ({self.status.value})>"


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    __table_args__ = (
        UniqueConstraint(
            "task_id", "depends_on_task_id", name="uq_task_dependency_pair"
        ),
        Index("idx_dependency_task_id", "task_id"),
        Index("idx_dependency_depends_on", "depends_on_task_id"),
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    task_id = Column(
        Uuid,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    depends_on_task_id = Column(
        Uuid,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ─────────────────────────────────────────
    task = relationship(
        "Task", foreign_keys=[task_id], back_populates="dependencies"
    )
    depends_on_task = relationship(
        "Task", foreign_keys=[depends_on_task_id], back_populates="dependents"
    )

    def __repr__(self):
        return f"<TaskDependency {self.task_id} -> {self.depends_on_task_id}>"
