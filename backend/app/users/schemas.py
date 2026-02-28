"""
Users Schemas (Pydantic)
------------------------
Request schemas for the users module operations.
"""

from typing import Literal
from pydantic import BaseModel

class UserRoleUpdate(BaseModel):
    """Schema for updating a user's role."""
    # Enforces exactly these string values:
    role: Literal["admin", "scrum_master", "team_member"]
