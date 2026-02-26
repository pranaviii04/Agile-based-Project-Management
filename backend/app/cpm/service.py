"""
CPM Service
-----------
Bridges the CPM engine with the rest of the application.

Responsibilities (once implemented):
  - Accept a project/sprint ID, fetch its tasks from the DB
  - Build the CPM input graph
  - Run the CPM engine
  - Return / persist the results

NOTE: Not implemented yet — only function signatures are scaffolded.
"""

from sqlalchemy.orm import Session

from app.cpm.engine import CPMEngine
from app.cpm.schemas import CPMInput, CPMResult

# Single reusable engine instance
_engine = CPMEngine()


def compute_cpm(data: CPMInput) -> CPMResult:
    """
    Run CPM on a manually provided task graph (no DB lookup).
    Useful for ad-hoc calculations via the API.
    """
    raise NotImplementedError


def compute_cpm_for_project(db: Session, project_id: int) -> CPMResult:
    """
    Fetch all tasks for the given project from the database,
    build the dependency graph, and run CPM.
    """
    raise NotImplementedError


def compute_cpm_for_sprint(db: Session, sprint_id: int) -> CPMResult:
    """
    Fetch all tasks for the given sprint from the database,
    build the dependency graph, and run CPM.
    """
    raise NotImplementedError
