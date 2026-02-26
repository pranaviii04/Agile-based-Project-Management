"""
Shared Dependencies
-------------------
FastAPI dependencies used across multiple routers:

  • get_current_user  → extracts JWT from the Authorization header,
                         validates it, and returns the User ORM object.
  • require_role      → factory that creates a dependency checking
                         whether the current user has one of the
                         allowed roles (returns 403 otherwise).
"""

from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth import decode_access_token

# Tells FastAPI where clients should send credentials to get a token.
# This also makes the "Authorize" button appear in Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency: decode JWT → look up user in DB → return User object.
    Raises 401 if the token is invalid or the user doesn't exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*allowed_roles: UserRole):
    """
    Factory that returns a FastAPI dependency.

    Usage in a route:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])

    If the user's role is not in `allowed_roles`, a 403 is raised.
    """

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
