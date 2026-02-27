"""
Role-Based Access Control (RBAC) Dependencies
----------------------------------------------
Reusable dependency factory for restricting endpoints by user role.

Usage:
    from app.auth.permissions import require_role
    from app.models.user import UserRole

    @router.post("/", dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.SCRUM_MASTER))])
    def create_something(...):
        ...

This module re-exports the `require_role` factory that already lives in
`app.dependencies` so that RBAC imports have a clear, dedicated home
(`app.auth.permissions`) without duplicating logic.
"""

from app.dependencies import require_role  # noqa: F401 — intentional re-export

__all__ = ["require_role"]
