"""
User Model
----------
Defines the `User` table and the `UserRole` enum.

Roles:
  - ADMIN          → full access, manages users and projects
  - SCRUM_MASTER   → manages sprints and assigns tasks
  - TEAM_MEMBER    → works on assigned tasks
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum

from app.database import Base


class UserRole(str, enum.Enum):
    """Roles available in the system."""
    ADMIN = "admin"
    SCRUM_MASTER = "scrum_master"
    TEAM_MEMBER = "team_member"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), nullable=False, default=UserRole.TEAM_MEMBER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"
