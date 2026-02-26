"""
Application Configuration
-------------------------
Loads settings from environment variables (or a .env file).
All sensitive values (DB URL, JWT secret) live here so they are
easy to change without touching code.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/agile_pm"

    # ── JWT ───────────────────────────────────────────────────
    SECRET_KEY: str = "super-secret-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # token valid for 1 hour

    class Config:
        env_file = ".env"  # optional .env file in the backend/ folder


# Single, reusable settings instance
settings = Settings()
