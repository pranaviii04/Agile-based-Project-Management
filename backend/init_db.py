"""
init_db.py — One-time database initialisation script
------------------------------------------------------
Run this script ONCE to create all tables in your PostgreSQL database
(Supabase or any other host).

Usage (run from the backend/ folder):
    python init_db.py

SQLAlchemy's create_all() is safe to run repeatedly:
  - If a table already EXISTS  → it is left untouched (no data lost).
  - If a table does NOT exist  → it is created.

You do NOT need to run this manually after the first time because
main.py calls Base.metadata.create_all() automatically on every startup.
"""

import sys
import traceback

# ── Load settings (reads DATABASE_URL from .env) ──────────────────────────────
from app.config import settings
from app.database import engine, Base

# ── Import every model so Base.metadata knows all table definitions ────────────
# If you add a new model in the future, import it here too.
from app.models import user          # noqa: F401  — users table
from app.projects import models      # noqa: F401  — projects table
from app.sprints import models       # noqa: F401  — sprints table
from app.tasks import models         # noqa: F401  — tasks + task_dependencies tables


def init_db():
    print("=" * 55)
    print("  AgilePM — Database Initialisation")
    print("=" * 55)
    print(f"  Connecting to: {settings.DATABASE_URL[:60]}...")
    print()

    try:
        # create_all() inspects Base.metadata and issues CREATE TABLE IF NOT EXISTS
        # for every model class registered above.
        Base.metadata.create_all(bind=engine)
        print("[OK] All tables created (or already exist) successfully.")
        print()
        print("  Tables registered:")
        for table_name in Base.metadata.tables:
            print(f"    - {table_name}")

    except Exception:
        print("[ERROR] Failed to create tables. Full traceback:")
        traceback.print_exc()
        sys.exit(1)

    print()
    print("  Done. You can now start the server:")
    print("    uvicorn app.main:app --reload")
    print("=" * 55)


if __name__ == "__main__":
    init_db()
