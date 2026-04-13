"""
migrations/env.py
-----------------
Alembic environment configuration.

This file is called by Alembic to:
  1. Connect to the database (using our existing DATABASE_URL from .env)
  2. Know which tables exist (by importing all SQLAlchemy models)
  3. Compare the current DB schema against the models and generate migrations

Two run modes:
  - offline: generates raw SQL without a live DB connection (useful for review)
  - online:  connects to the DB and applies migrations directly
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Step 1: Pull our app's config (reads DATABASE_URL from .env) ──────────────
from app.config import settings

# ── Step 2: Import Base + ALL models so Alembic sees the full schema ──────────
# If you add a new model in the future, import it here.
from app.database import Base
from app.models import user          # noqa: F401  — users table
from app.projects import models      # noqa: F401  — projects table
from app.sprints import models       # noqa: F401  — sprints table
from app.tasks import models         # noqa: F401  — tasks + task_dependencies tables

# ── Alembic Config object (reads alembic.ini) ─────────────────────────────────
config = context.config

# Set up Python logging from the alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override the sqlalchemy.url with our real DATABASE_URL from .env
# This means we never hardcode credentials in alembic.ini
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Tell Alembic to compare migrations against OUR model metadata
target_metadata = Base.metadata


# ── Offline migration (generates SQL file, no live connection needed) ──────────
def run_migrations_offline() -> None:
    """
    Run migrations without a DB connection.
    Outputs SQL to stdout — useful for review before applying.

    Usage:  alembic upgrade head --sql
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online migration (connects to DB and applies changes directly) ─────────────
def run_migrations_online() -> None:
    """
    Run migrations against a live database connection.

    Usage:  alembic upgrade head
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # no connection pooling during migrations
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # compare_type=True causes Alembic to detect column TYPE changes too
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


# ── Entry point ───────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
