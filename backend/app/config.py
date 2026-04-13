"""
Application Configuration
-------------------------
Loads settings from environment variables (or a .env file).
All sensitive values (DB URL, JWT secret) live here so they are
easy to change without touching code.

To override any value without editing this file, either:
  - Set an environment variable before starting the server, or
  - Create a file called .env in the backend/ directory.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    # Supabase-hosted PostgreSQL connection string.
    # Format: postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require
    # sslmode=require is mandatory for Supabase — they reject unencrypted connections.
    DATABASE_URL: str = (
        "postgresql://postgres:agile-db-sw@db.aklehdseeaejdselozhz.supabase.co:5432/postgres?sslmode=require"
    )

    # ── JWT ───────────────────────────────────────────────────
    SECRET_KEY: str = "super-secret-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # token valid for 1 hour

    class Config:
        env_file = ".env"  # optional .env file in the backend/ folder


# Single, reusable settings instance used throughout the app
settings = Settings()
