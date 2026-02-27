"""
Auth Router
-----------
Handles user registration, login, and profile retrieval.

Endpoints:
  POST /auth/register  → create a new user account
  POST /auth/login     → authenticate and receive a JWT
  GET  /auth/me        → retrieve the logged-in user's profile
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Register ──────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Checks that the email is not already taken.
    - Hashes the password before storing.
    - Returns the created user (without password).
    """
    # Check for duplicate email
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    # Create user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ── Login ─────────────────────────────────────────────────────


@router.post(
    "/login",
    response_model=Token,
    summary="Login and get a JWT",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate a user with email + password.

    Swagger UI sends credentials via the OAuth2 password flow
    (form fields: `username` and `password`).  Enter your **email**
    in the *username* field.

    Returns a Bearer access token on success.
    """
    # OAuth2 spec uses "username"; we treat it as the email address
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    # Encode user info in the JWT payload
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}
    )

    return Token(access_token=access_token)


# ── Me (Protected) ───────────────────────────────────────────


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.
    Requires a valid Bearer token in the Authorization header.
    """
    return current_user
