"""
One-time migration script: SQLite -> PostgreSQL.

Run from the backend/ directory with the venv313 Python:
    python migrate_to_postgres.py

What it does:
  1. Reads every row from kalpa.db (SQLite).
  2. Creates the schema in kalpa_db (PostgreSQL) using the existing ORM models.
  3. Copies every row in dependency order so foreign-key constraints are satisfied.
  4. Verifies row counts match exactly.
  5. Exits non-zero if ANY count mismatch is detected.

Rollback: change DATABASE_URL in .env back to sqlite:///./kalpa.db — SQLite is never modified.
"""

import os
import sys

# ---------------------------------------------------------------------------
# Paths — resolve relative to this file so the script can be run from anywhere
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

SQLITE_URL = f"sqlite:///{os.path.join(BACKEND_DIR, 'kalpa.db')}"
PG_URL = "postgresql://postgres:Swarajya%4019@localhost:5432/kalpa_db"

# ---------------------------------------------------------------------------
# Import ORM models — this registers all tables with Base.metadata
# ---------------------------------------------------------------------------
from sqlalchemy import create_engine, text
from app.models.db_models import Base, ProductModel, Product, ProductEvent, ScanLog, Notification  # noqa: F401
from app.models.user import User  # noqa: F401

# Migration order must respect FK dependencies:
#   product_models  <- products <- product_events
#                              <- notifications
#                              <- scan_logs
#   users  (independent)
TABLES = [
    ("product_models", ProductModel.__table__),
    ("users",          User.__table__),
    ("products",       Product.__table__),
    ("product_events", ProductEvent.__table__),
    ("notifications",  Notification.__table__),
    ("scan_logs",      ScanLog.__table__),
]


def _count(conn, table_name: str) -> int:
    return conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).scalar()


def main() -> None:
    print("=" * 62)
    print("  SQLite -> PostgreSQL Migration")
    print("=" * 62)

    sqlite_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    pg_engine     = create_engine(PG_URL)

    # ------------------------------------------------------------------
    # 1. Read SQLite counts (source of truth)
    # ------------------------------------------------------------------
    print("\n[1] SQLite record counts (source of truth)")
    sqlite_counts: dict[str, int] = {}
    with sqlite_engine.connect() as conn:
        for name, _ in TABLES:
            c = _count(conn, name)
            sqlite_counts[name] = c
            print(f"    {name:<22} {c:>5} rows")
    total_sqlite = sum(sqlite_counts.values())
    print(f"    {'TOTAL':<22} {total_sqlite:>5} rows")

    # ------------------------------------------------------------------
    # 2. Create PostgreSQL schema
    # ------------------------------------------------------------------
    print("\n[2] Creating PostgreSQL schema from ORM models...")
    Base.metadata.create_all(bind=pg_engine)
    print("    Schema created OK")

    # ------------------------------------------------------------------
    # 3. Guard — abort if PostgreSQL already has data to prevent duplicates
    # ------------------------------------------------------------------
    with pg_engine.connect() as conn:
        existing_users = _count(conn, "users")
    if existing_users > 0:
        print(f"\n    ERROR: PostgreSQL already contains {existing_users} user(s).")
        print("    Migration aborted to prevent duplicate data.")
        print("    To re-run: drop all tables in kalpa_db then try again.")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 4. Migrate table by table in FK dependency order
    # ------------------------------------------------------------------
    print("\n[3] Migrating data...")
    for name, table_obj in TABLES:
        # Read all rows from SQLite (SQLAlchemy handles type conversion)
        with sqlite_engine.connect() as src:
            rows = [dict(r) for r in src.execute(table_obj.select()).mappings().all()]

        if rows:
            with pg_engine.begin() as dst:
                dst.execute(table_obj.insert(), rows)

        print(f"    {name:<22} {len(rows):>5} rows  ->  PostgreSQL")

    # ------------------------------------------------------------------
    # 5. Verify counts
    # ------------------------------------------------------------------
    print("\n[4] Verifying migration integrity...")
    print()
    print(f"  {'Table':<22}  {'SQLite':>8}    {'PostgreSQL':>10}    Result")
    print(f"  {'-'*22}  {'-'*8}    {'-'*10}    ------")

    all_match = True
    pg_counts: dict[str, int] = {}

    with pg_engine.connect() as conn:
        for name, _ in TABLES:
            pg_c = _count(conn, name)
            pg_counts[name] = pg_c
            match = pg_c == sqlite_counts[name]
            result = "PASS" if match else "MISMATCH"
            if not match:
                all_match = False
            print(f"  {name:<22}  {sqlite_counts[name]:>8}    {pg_c:>10}    {result}")

    total_pg = sum(pg_counts.values())
    print(f"\n  {'TOTAL':<22}  {total_sqlite:>8}    {total_pg:>10}")
    print()

    if not all_match:
        print("  Integrity Check: FAILED")
        print("  COUNT MISMATCH DETECTED. Do NOT switch .env to PostgreSQL.")
        print("  SQLite is untouched. Investigate then re-run.")
        sys.exit(1)

    print("  Integrity Check: PASSED")
    print()
    print("=" * 62)
    print("  Migration successful.")
    print("  Next step: update DATABASE_URL in .env to PostgreSQL URL.")
    print("=" * 62)


if __name__ == "__main__":
    main()
