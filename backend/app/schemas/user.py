"""
User Schemas (Pydantic)
-----------------------
Define the shape of data coming IN (requests) and going OUT (responses).
Pydantic validates everything automatically — no manual checks needed.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


# ── Request Schemas ───────────────────────────────────────────


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.TEAM_MEMBER


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# ── Response Schemas ──────────────────────────────────────────


class UserResponse(BaseModel):
    """Schema returned after registration or on GET /me.
    Never exposes the hashed password."""
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # allows ORM model → Pydantic conversion


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
