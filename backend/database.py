"""
SQLite database layer for experiment metadata and activity tracking.
Uses aiosqlite for async access. Schema auto-creates on first connect.
"""

import aiosqlite
import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from backend.config import get_settings

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('RAG', 'LLM', 'RET')),
    config TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK(status IN ('queued','running','paused','completed','failed','cancelled')),
    progress TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT,
    result_files TEXT NOT NULL DEFAULT '[]',
    aggregates TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id TEXT REFERENCES experiments(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    message TEXT,
    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_created ON experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_experiment ON activity_log(experiment_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC);
"""


async def get_db_connection() -> aiosqlite.Connection:
    """Get a new database connection."""
    settings = get_settings()
    settings.abs_database_path.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(str(settings.abs_database_path))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Initialize database schema."""
    db = await get_db_connection()
    try:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
    finally:
        await db.close()


# ─── Experiment CRUD helpers ─────────────────────────────────────────

async def create_experiment(db: aiosqlite.Connection, experiment: dict) -> str:
    """Insert a new experiment row. Returns the experiment id."""
    await db.execute(
        """INSERT INTO experiments (id, name, mode, config, status, created_at)
           VALUES (?, ?, ?, ?, 'queued', ?)""",
        (
            experiment["id"],
            experiment["name"],
            experiment["mode"],
            json.dumps(experiment.get("config", {})),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    await db.commit()
    return experiment["id"]


async def get_experiment(db: aiosqlite.Connection, experiment_id: str) -> Optional[dict]:
    """Fetch a single experiment by ID."""
    cursor = await db.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,))
    row = await cursor.fetchone()
    if row is None:
        return None
    return _row_to_dict(row)


async def list_experiments(
    db: aiosqlite.Connection,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[dict], int]:
    """List experiments with optional status filter and pagination."""
    where = "WHERE status = ?" if status else ""
    params = [status] if status else []

    # Count
    count_cursor = await db.execute(
        f"SELECT COUNT(*) FROM experiments {where}", params
    )
    total = (await count_cursor.fetchone())[0]

    # Fetch page
    offset = (page - 1) * per_page
    cursor = await db.execute(
        f"SELECT * FROM experiments {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [per_page, offset],
    )
    rows = await cursor.fetchall()
    return [_row_to_dict(r) for r in rows], total


async def update_experiment(db: aiosqlite.Connection, experiment_id: str, **fields):
    """Update specific fields on an experiment."""
    if not fields:
        return
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = []
    for k, v in fields.items():
        if isinstance(v, (dict, list)):
            values.append(json.dumps(v))
        else:
            values.append(v)
    values.append(experiment_id)
    await db.execute(
        f"UPDATE experiments SET {set_clause} WHERE id = ?", values
    )
    await db.commit()


async def get_next_queued(db: aiosqlite.Connection) -> Optional[dict]:
    """Get the oldest queued experiment (FIFO queue)."""
    cursor = await db.execute(
        "SELECT * FROM experiments WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1"
    )
    row = await cursor.fetchone()
    return _row_to_dict(row) if row else None


# ─── Activity Log helpers ────────────────────────────────────────────

async def add_activity(
    db: aiosqlite.Connection,
    experiment_id: str,
    event: str,
    message: str = "",
):
    """Insert an activity log entry."""
    await db.execute(
        "INSERT INTO activity_log (experiment_id, event, message) VALUES (?, ?, ?)",
        (experiment_id, event, message),
    )
    await db.commit()


async def get_recent_activity(db: aiosqlite.Connection, limit: int = 20) -> list[dict]:
    """Get the most recent activity log entries."""
    cursor = await db.execute(
        """SELECT a.*, e.name as experiment_name
           FROM activity_log a
           LEFT JOIN experiments e ON a.experiment_id = e.id
           ORDER BY a.timestamp DESC LIMIT ?""",
        (limit,),
    )
    rows = await cursor.fetchall()
    return [_row_to_dict(r) for r in rows]


async def get_experiment_stats(db: aiosqlite.Connection) -> dict:
    """Get counts by status."""
    cursor = await db.execute(
        "SELECT status, COUNT(*) as count FROM experiments GROUP BY status"
    )
    rows = await cursor.fetchall()
    stats = {"total": 0, "queued": 0, "running": 0, "completed": 0, "failed": 0, "cancelled": 0, "paused": 0}
    for row in rows:
        stats[row["status"]] = row["count"]
        stats["total"] += row["count"]
    return stats


# ─── Helpers ─────────────────────────────────────────────────────────

def _row_to_dict(row) -> dict:
    """Convert an aiosqlite Row to a plain dict, parsing JSON fields."""
    d = dict(row)
    for json_field in ("config", "progress", "result_files", "aggregates"):
        if json_field in d and d[json_field] is not None:
            try:
                d[json_field] = json.loads(d[json_field])
            except (json.JSONDecodeError, TypeError):
                pass
    return d
