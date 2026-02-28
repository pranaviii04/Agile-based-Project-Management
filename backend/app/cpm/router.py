"""
CPM Router
----------
Exposes the single HTTP endpoint to execute DB-backed CPM scheduling analysis.
Maintains a strict separation of concerns—no business logic or algorithm
details live here.
"""

from uuid import UUID
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.cpm.service import run_cpm_for_sprint
from app.auth.permissions import require_role
from app.models.user import UserRole


router = APIRouter(prefix="/sprints", tags=["CPM"])


# ── Endpoint Schemas ──────────────────────────────────────────

class CPMResponse(BaseModel):
    sprint_id: UUID
    project_duration: int
    critical_tasks: List[str]
    slack_values: Dict[str, int]


# ── Routes ────────────────────────────────────────────────────

@router.post(
    "/{sprint_id}/cpm",
    response_model=CPMResponse,
    summary="Run DB-Backed CPM Analysis for a Sprint",
    dependencies=[Depends(require_role(UserRole.SCRUM_MASTER))],
)
def execute_cpm(sprint_id: UUID, db: Session = Depends(get_db)):
    """
    Executes the DB-backed Critical Path Method (CPM) algorithm for a sprint.
    
    **Requires role:** `scrum_master`
    
    Retrieves sprint tasks and all their respective dependencies automatically from the database,
    returning exactly the project duration, critical tasks list, and slack values map.
    """
    try:
        # Execute the pure business logic service layer automatically connected to DB Data
        result = run_cpm_for_sprint(sprint_id, db)
        return result
        
    except ValueError as e:
        # Catch engine / service validation errors (e.g., circular dependencies)
        # and return as 400 Bad Request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
