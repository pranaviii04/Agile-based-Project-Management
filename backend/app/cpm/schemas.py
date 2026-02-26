"""
CPM Schemas (Pydantic)
----------------------
Data structures for CPM engine input and output.
These are pure data schemas — no database interaction.
"""

from pydantic import BaseModel, Field


# ── Input Schemas ─────────────────────────────────────────────


class CPMTask(BaseModel):
    """A single task fed into the CPM engine."""
    id: str = Field(..., description="Unique task identifier")
    name: str = Field(..., description="Human-readable task name")
    duration: float = Field(..., ge=0, description="Duration in chosen time-unit (days, hours, etc.)")
    dependencies: list[str] = Field(
        default_factory=list,
        description="IDs of tasks that must complete before this one starts",
    )


class CPMInput(BaseModel):
    """Full input payload for a CPM computation."""
    tasks: list[CPMTask] = Field(..., min_length=1)


# ── Output Schemas ────────────────────────────────────────────


class CPMTaskResult(BaseModel):
    """Computed schedule data for a single task."""
    id: str
    name: str
    duration: float
    earliest_start: float = Field(..., description="ES")
    earliest_finish: float = Field(..., description="EF")
    latest_start: float = Field(..., description="LS")
    latest_finish: float = Field(..., description="LF")
    total_float: float = Field(..., description="Slack / float")
    is_critical: bool = Field(..., description="True if task is on the critical path")


class CPMResult(BaseModel):
    """Complete output of a CPM computation."""
    tasks: list[CPMTaskResult]
    critical_path: list[str] = Field(..., description="Ordered list of task IDs on the critical path")
    project_duration: float = Field(..., description="Total duration of the project (longest path)")
