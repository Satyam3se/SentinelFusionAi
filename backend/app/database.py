"""
SentinelFusion AI - Database Manager & Schema Initialization
Uses SQLite with WAL mode, foreign keys, and clean transactions.
"""
import sqlite3
import json
import logging
from datetime import datetime, timezone
from contextlib import contextmanager
from typing import Generator, Any, Dict, List, Optional
from .config import DB_PATH, DEMO_SOURCES, FICTIONAL_ZONES

logger = logging.getLogger("sentinelfusion.database")

def get_db_connection() -> sqlite3.Connection:
    """Create and configure a SQLite connection."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def db_session() -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional database session."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction rollback due to error: {e}")
        raise
    finally:
        conn.close()

def init_db() -> None:
    """Initialize database tables, indexes, and initial reference data."""
    with db_session() as conn:
        cursor = conn.cursor()

        # 1. Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_login_at TEXT,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TEXT
        );
        """)

        # 2. Synthetic Sources table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            source_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            fictional_zone TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ONLINE',
            staleness_threshold_sec INTEGER DEFAULT 300,
            last_heartbeat_at TEXT,
            last_report_at TEXT,
            total_reports_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            notes TEXT
        );
        """)

        # 3. Reports table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT UNIQUE NOT NULL,
            source_id TEXT NOT NULL,
            source_type TEXT NOT NULL,
            fictional_zone TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            raw_payload TEXT,
            confidence_score REAL DEFAULT 0.5,
            status TEXT NOT NULL DEFAULT 'INGESTED',
            data_quality_status TEXT NOT NULL DEFAULT 'VALID',
            missing_fields TEXT DEFAULT '[]',
            is_synthetic INTEGER DEFAULT 1,
            report_timestamp TEXT NOT NULL,
            received_timestamp TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES sources (source_id) ON DELETE SET NULL
        );
        """)

        # 4. Incidents table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            fictional_zone TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'MEDIUM',
            status TEXT NOT NULL DEFAULT 'NEW',
            correlation_confidence TEXT NOT NULL DEFAULT 'MEDIUM',
            recommendation TEXT NOT NULL DEFAULT 'PROCEED_VERIFICATION',
            heuristic_score REAL DEFAULT 50.0,
            score_components TEXT DEFAULT '{}',
            conflicting_evidence TEXT DEFAULT '[]',
            missing_evidence TEXT DEFAULT '[]',
            source_health_summary TEXT DEFAULT '{}',
            assigned_reviewer_id INTEGER,
            reviewer_username TEXT,
            reviewer_notes TEXT,
            correction_reason TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            reviewed_at TEXT,
            FOREIGN KEY (assigned_reviewer_id) REFERENCES users (id) ON DELETE SET NULL
        );
        """)

        # 5. Incident-Report association table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS incident_reports (
            incident_id TEXT NOT NULL,
            report_id TEXT NOT NULL,
            correlation_rule TEXT NOT NULL,
            match_strength REAL DEFAULT 1.0,
            is_duplicate INTEGER DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            PRIMARY KEY (incident_id, report_id),
            FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
            FOREIGN KEY (report_id) REFERENCES reports (report_id) ON DELETE CASCADE
        );
        """)

        # 6. Review decisions history (Audit-safe decision log)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS review_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            reviewer_id INTEGER NOT NULL,
            reviewer_username TEXT NOT NULL,
            reviewer_role TEXT NOT NULL,
            action TEXT NOT NULL,
            original_priority TEXT NOT NULL,
            resulting_priority TEXT NOT NULL,
            original_status TEXT NOT NULL,
            resulting_status TEXT NOT NULL,
            original_recommendation TEXT NOT NULL,
            correction_reason TEXT,
            notes TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
            FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
        );
        """)

        # 7. Verification requests
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS verification_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT NOT NULL,
            requested_by INTEGER NOT NULL,
            requested_by_username TEXT NOT NULL,
            target_source_type TEXT NOT NULL,
            fictional_zone TEXT NOT NULL,
            specific_questions TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'MEDIUM',
            status TEXT NOT NULL DEFAULT 'OPEN',
            response_notes TEXT,
            created_at TEXT NOT NULL,
            resolved_at TEXT,
            FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
            FOREIGN KEY (requested_by) REFERENCES users (id) ON DELETE SET NULL
        );
        """)

        # 8. Append-only Audit Trail
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            actor_id INTEGER,
            actor_username TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            previous_state TEXT,
            resulting_state TEXT,
            details TEXT,
            ip_address TEXT
        );
        """)

        # 9. Rate limit tracking
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS rate_limits (
            key TEXT PRIMARY KEY,
            attempt_count INTEGER DEFAULT 1,
            window_start REAL NOT NULL
        );
        """)

        # 10. System health & telemetry log
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_health_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            component TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            details TEXT
        );
        """)

        # 11. Offline local sync outbox
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS offline_outbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_mutation_id TEXT UNIQUE NOT NULL,
            action_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            created_at TEXT NOT NULL,
            synced_at TEXT
        );
        """)

        # Populate reference sources if empty
        cursor.execute("SELECT COUNT(*) FROM sources;")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            for src in DEMO_SOURCES:
                cursor.execute("""
                INSERT INTO sources (source_id, name, source_type, fictional_zone, status, staleness_threshold_sec, last_heartbeat_at, last_report_at, total_reports_count, error_count, notes)
                VALUES (?, ?, ?, ?, 'ONLINE', ?, ?, ?, 0, 0, ?);
                """, (
                    src["source_id"],
                    src["name"],
                    src["source_type"],
                    src["zone"],
                    src["staleness_threshold_sec"],
                    now_iso,
                    now_iso,
                    f"Configured synthetic demonstration source in {src['zone']}"
                ))

        logger.info("Database initialized successfully with all tables and reference sources.")

def dict_from_row(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    """Convert SQLite Row to python dict."""
    if row is None:
        return None
    return dict(row)

def dicts_from_rows(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    """Convert SQLite Rows list to python dicts list."""
    return [dict(r) for r in rows]
