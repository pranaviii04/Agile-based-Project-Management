"""
Users Router
------------
API endpoints for managing system users and roles.

Endpoints:
  PATCH  /users/{user_id}/role      → Update a user's role       [admin]
  PATCH  /users/{user_id}/password  → Reset a user's password    [admin]
  GET    /users                     → List all system users      [admin]
"""

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.users.schemas import UserRoleUpdate, UserPasswordReset
from app.users import service as user_service

router = APIRouter(prefix="/users", tags=["Users (Admin)"])


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Update user role",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
):
    """
    Change a user's role.
    
    **Requires role:** `admin`

    Valid roles: `admin`, `scrum_master`, `team_member`
    Raises 422 if an invalid string is passed.
    Raises 404 if the user does not exist.
    """
    return user_service.update_user_role(user_id=user_id, new_role=payload.role, db=db)


@router.patch(
    "/{user_id}/password",
    response_model=UserResponse,
    summary="Reset user password",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def reset_user_password(
    user_id: int,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
):
    """
    Reset a user's password.

    **Requires role:** `admin`

    Allows the admin to set a new password for any user so they
    can log in. The user should change their password afterwards.
    """
    return user_service.reset_user_password(
        user_id=user_id, new_password=payload.new_password, db=db
    )


@router.get(
    "/",
    response_model=List[UserResponse],
    summary="List all users",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def get_all_users(
    db: Session = Depends(get_db),
):
    """
    Returns a unified list of all registered users in the system.
    
    **Requires role:** `admin`
    """
    return user_service.get_all_users(db)
