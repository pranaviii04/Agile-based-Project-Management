"""
migrate.py — SQLite → PostgreSQL (Supabase) Data Migration
===========================================================
Transfers all existing data from agile_pm.db (SQLite) into the
PostgreSQL database configured in backend/.env.

Migration order (respects foreign-key dependencies):
  1. users              (no FK dependencies)
  2. projects           (no FK dependencies)
  3. sprints            (FK → projects)
  4. tasks              (FK → sprints, users)
  5. task_dependencies  (FK → tasks × 2)

Safety:
  - Each table is skipped automatically if it already has rows in PostgreSQL.
  - Run as many times as you like — never duplicates data.
  - Rolls back the entire session on any error.

Usage (run from the backend/ folder):
    python migrate.py
"""

import sqlite3
import uuid
from datetime import datetime, date

# ── Load app environment (.env → DATABASE_URL) ────────────────────────────────
from app.config import settings  # reads .env
from app.database import SessionLocal

# ── Import all models (registers them with SQLAlchemy metadata) ───────────────
from app.models.user import User, UserRole
from app.projects.models import Project
from app.sprints.models import Sprint, SprintStatus
from app.tasks.models import Task, TaskStatus, TaskDependency

# ── Configuration ─────────────────────────────────────────────────────────────
SQLITE_PATH = "agile_pm.db"   # relative to backend/ folder
BATCH_SIZE = 100               # rows committed per batch


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════

def connect_sqlite() -> sqlite3.Connection:
    """Open a SQLite connection with row_factory so rows act like dicts."""
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row   # access columns by name: row["email"]
    return conn


def to_dt(value: str | None) -> datetime | None:
    """
    Convert a SQLite datetime string (or None) to a Python datetime object.
    SQLite stores datetimes as ISO-8601 text: '2026-02-27 08:31:53.920242'
    """
    if not value:
        return None
    # Handle both 'YYYY-MM-DD HH:MM:SS' and 'YYYY-MM-DD HH:MM:SS.ffffff'
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def to_date(value: str | None) -> date | None:
    """Convert a SQLite date string 'YYYY-MM-DD' to a Python date."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def to_uuid(hex_str: str | None) -> uuid.UUID | None:
    """
    Convert a UUID stored as a 32-char hex string (no hyphens) to a UUID object.
    SQLite stored them like: '238908dd2ea84566bf1f5ed99fdace00'
    PostgreSQL needs a proper UUID: '238908dd-2ea8-4566-bf1f-5ed99fdace00'
    """
    if not hex_str:
        return None
    try:
        return uuid.UUID(hex_str)
    except (ValueError, AttributeError):
        return None


def table_has_data(db, model_class) -> bool:
    """Return True if the PostgreSQL table already has at least one row."""
    return db.query(model_class).first() is not None


def print_header(title: str) -> None:
    print(f"\n{'-' * 55}")
    print(f"  {title}")
    print(f"{'-' * 55}")


# ══════════════════════════════════════════════════════════════════════════════
# Migration functions — one per table
# ══════════════════════════════════════════════════════════════════════════════

def migrate_users(sqlite_conn: sqlite3.Connection, db) -> None:
    """
    Migrate the `users` table.

    SQLite schema:
        id INTEGER PK, email TEXT, full_name TEXT, hashed_password TEXT,
        role TEXT, is_active INTEGER (0/1), created_at TEXT

    Notes:
        - SQLite role values are uppercase ('ADMIN', 'TEAM_MEMBER').
          We lowercase them to match the PostgreSQL Enum ('admin', 'team_member').
        - is_active is 1/0 in SQLite; Python treats any int as truthy, but
          we explicitly convert to bool for clarity.
        - We preserve the original integer `id` so all FK references in sprints
          and tasks continue to point at the correct user.
    """
    print_header("Migrating: users")

    rows = sqlite_conn.execute("SELECT * FROM users ORDER BY id").fetchall()
    print(f"  Found {len(rows)} rows in SQLite.")

    inserted = skipped = 0
    for row in rows:
        # Skip users that already exist in PostgreSQL (matched by email)
        # This handles the admin seeder creating id=1 before migration runs.
        existing = db.query(User).filter(User.email == row["email"]).first()
        if existing:
            skipped += 1
            continue

        user = User(
            id=row["id"],
            email=row["email"],
            full_name=row["full_name"],
            hashed_password=row["hashed_password"],
            # Convert 'ADMIN' -> 'admin', 'TEAM_MEMBER' -> 'team_member'
            role=UserRole(row["role"].lower()),
            is_active=bool(row["is_active"]),
            created_at=to_dt(row["created_at"]),
        )
        db.add(user)
        inserted += 1

    db.commit()
    print(f"  [OK] {inserted} users inserted, {skipped} skipped (already exist).")

    # Build a mapping: SQLite user id -> PostgreSQL user id (by email)
    # This is needed so tasks can remap assigned_to correctly.
    pg_users = {u.email: u.id for u in db.query(User).all()}
    sqlite_id_to_pg_id = {}
    for row in rows:
        pg_id = pg_users.get(row["email"])
        if pg_id:
            sqlite_id_to_pg_id[row["id"]] = pg_id
    return sqlite_id_to_pg_id


def migrate_projects(sqlite_conn: sqlite3.Connection, db) -> None:
    """
    Migrate the `projects` table.

    SQLite schema:
        id TEXT (UUID hex, no hyphens), name TEXT, description TEXT,
        created_at TEXT, updated_at TEXT

    Notes:
        - Project IDs are 32-char hex strings → convert to uuid.UUID objects.
    """
    print_header("Migrating: projects")

    if table_has_data(db, Project):
        print("  [SKIP] projects table already has data in PostgreSQL.")
        return

    rows = sqlite_conn.execute("SELECT * FROM projects ORDER BY created_at").fetchall()
    print(f"  Found {len(rows)} rows in SQLite.")

    inserted = 0
    for row in rows:
        project = Project(
            id=to_uuid(row["id"]),
            name=row["name"],
            description=row["description"],
            created_at=to_dt(row["created_at"]),
            updated_at=to_dt(row["updated_at"]),
        )
        db.add(project)
        inserted += 1

    db.commit()
    print(f"  [OK] {inserted} projects inserted.")


def migrate_sprints(sqlite_conn: sqlite3.Connection, db) -> None:
    """
    Migrate the `sprints` table.

    SQLite schema:
        id TEXT (UUID hex), name TEXT, project_id TEXT (UUID hex),
        start_date TEXT, end_date TEXT, status TEXT,
        created_at TEXT, updated_at TEXT

    Notes:
        - status is uppercase in SQLite ('ACTIVE') → lowercase for PostgreSQL Enum.
        - start_date and end_date are 'YYYY-MM-DD' strings → Python date objects.
        - project_id must be converted to UUID to match FK.
    """
    print_header("Migrating: sprints")

    if table_has_data(db, Sprint):
        print("  [SKIP] sprints table already has data in PostgreSQL.")
        return

    rows = sqlite_conn.execute("SELECT * FROM sprints ORDER BY created_at").fetchall()
    print(f"  Found {len(rows)} rows in SQLite.")

    inserted = 0
    for row in rows:
        sprint = Sprint(
            id=to_uuid(row["id"]),
            name=row["name"],
            project_id=to_uuid(row["project_id"]),
            start_date=to_date(row["start_date"]),
            end_date=to_date(row["end_date"]),
            # 'ACTIVE' → SprintStatus.ACTIVE ('active')
            status=SprintStatus(row["status"].lower()),
            created_at=to_dt(row["created_at"]),
            updated_at=to_dt(row["updated_at"]),
        )
        db.add(sprint)
        inserted += 1

    db.commit()
    print(f"  [OK] {inserted} sprints inserted.")


def migrate_tasks(sqlite_conn: sqlite3.Connection, db, user_id_map: dict) -> None:
    """
    Migrate the `tasks` table.

    SQLite schema:
        id TEXT (UUID hex), name TEXT, description TEXT, duration INTEGER,
        priority INTEGER, status TEXT, sprint_id TEXT (UUID hex),
        assigned_to INTEGER (nullable FK → users.id),
        created_at TEXT, updated_at TEXT

    Notes:
        - status is uppercase ('DONE', 'IN_PROGRESS') → lowercase for Enum.
        - assigned_to can be NULL (task unassigned) — handled safely.
    """
    print_header("Migrating: tasks")

    if table_has_data(db, Task):
        print("  [SKIP] tasks table already has data in PostgreSQL.")
        return

    rows = sqlite_conn.execute("SELECT * FROM tasks ORDER BY created_at").fetchall()
    print(f"  Found {len(rows)} rows in SQLite.")

    inserted = 0
    for row in rows:
        # Remap assigned_to: SQLite user id -> PostgreSQL user id
        # If the SQLite user id is not in the map, set to None (unassigned)
        sqlite_assigned = row["assigned_to"]
        pg_assigned = user_id_map.get(sqlite_assigned) if sqlite_assigned else None

        task = Task(
            id=to_uuid(row["id"]),
            name=row["name"],
            description=row["description"],
            duration=row["duration"],
            priority=row["priority"],
            # 'IN_PROGRESS' -> 'in_progress', 'DONE' -> 'done', etc.
            status=TaskStatus(row["status"].lower()),
            sprint_id=to_uuid(row["sprint_id"]),
            assigned_to=pg_assigned,
            created_at=to_dt(row["created_at"]),
            updated_at=to_dt(row["updated_at"]),
        )
        db.add(task)
        inserted += 1

        # Commit in batches to avoid holding a huge transaction
        if inserted % BATCH_SIZE == 0:
            db.commit()
            print(f"    ... {inserted} rows committed so far.")

    db.commit()
    print(f"  [OK] {inserted} tasks inserted.")


def migrate_task_dependencies(sqlite_conn: sqlite3.Connection, db) -> None:
    """
    Migrate the `task_dependencies` table.

    SQLite schema:
        id TEXT (UUID hex), task_id TEXT (UUID hex),
        depends_on_task_id TEXT (UUID hex), created_at TEXT

    Notes:
        - Both task_id and depends_on_task_id must exist in the tasks table
          already migrated in the previous step — order matters.
    """
    print_header("Migrating: task_dependencies")

    if table_has_data(db, TaskDependency):
        print("  [SKIP] task_dependencies table already has data in PostgreSQL.")
        return

    rows = sqlite_conn.execute("SELECT * FROM task_dependencies ORDER BY created_at").fetchall()
    print(f"  Found {len(rows)} rows in SQLite.")

    inserted = 0
    for row in rows:
        dep = TaskDependency(
            id=to_uuid(row["id"]),
            task_id=to_uuid(row["task_id"]),
            depends_on_task_id=to_uuid(row["depends_on_task_id"]),
            created_at=to_dt(row["created_at"]),
        )
        db.add(dep)
        inserted += 1

    db.commit()
    print(f"  [OK] {inserted} task_dependencies inserted.")


# ══════════════════════════════════════════════════════════════════════════════
# Entry point
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 55)
    print("  AgilePM -- SQLite to PostgreSQL Migration")
    print("=" * 55)
    print(f"  Source:  {SQLITE_PATH}")
    print(f"  Target:  {settings.DATABASE_URL[:60]}...")

    # Open both connections
    sqlite_conn = connect_sqlite()
    db = SessionLocal()

    try:
        # Run in FK-dependency order — DO NOT change the order
        user_id_map = migrate_users(sqlite_conn, db)   # returns {sqlite_id: pg_id}
        migrate_projects(sqlite_conn, db)
        migrate_sprints(sqlite_conn, db)
        migrate_tasks(sqlite_conn, db, user_id_map)    # needs the ID remap
        migrate_task_dependencies(sqlite_conn, db)

        print("\n" + "=" * 55)
        print("  Migration complete! All data transferred.")
        print("=" * 55)

    except Exception as e:
        # Roll back everything if any step fails
        db.rollback()
        print(f"\n[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        print("\n  PostgreSQL session rolled back. No partial data was committed.")
        raise

    finally:
        sqlite_conn.close()
        db.close()


if __name__ == "__main__":
    main()
