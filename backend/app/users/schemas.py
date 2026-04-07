"""
Users Schemas (Pydantic)
------------------------
Request schemas for the users module operations.
"""

from typing import Literal
from pydantic import BaseModel, Field


class UserRoleUpdate(BaseModel):
    """Schema for updating a user's role."""
    # Enforces exactly these string values:
    role: Literal["admin", "scrum_master", "team_member"]


class UserPasswordReset(BaseModel):
    """Schema for admin-initiated password reset."""
    new_password: str = Field(..., min_length=6, max_length=128)
