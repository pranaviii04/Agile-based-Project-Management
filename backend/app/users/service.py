"""
Users Service Layer
-------------------
Business logic for managing users.
"""

from typing import List
from fastapi import status
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.exceptions import raise_error

def get_all_users(db: Session) -> List[User]:
    """Retrieve all users across the system."""
    return db.query(User).order_by(User.id.asc()).all()

def update_user_role(user_id: int, new_role: str, db: Session) -> User:
    """
    Safely update a user's role.
    Raises 404 if the user doesn't exist.
    Contains safeguard to prevent the last admin from stripping their own role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise_error(
            status.HTTP_404_NOT_FOUND,
            f"User {user_id} not found."
        )

    # Optional safeguard: Prevent removing the last admin's permissions
    if user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
        if admin_count <= 1:
            raise_error(
                status.HTTP_400_BAD_REQUEST,
                "Cannot remove role from the final remaining admin in the system."
            )

    user.role = new_role
    db.commit()
    db.refresh(user)
    
    return user
