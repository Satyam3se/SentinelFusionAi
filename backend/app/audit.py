"""
SentinelFusion AI - Append-Only Audit Logging Subsystem
Logs all material state transitions and reviewer actions for accountability.
"""
import json
from datetime import datetime, timezone
from typing import Optional, Any, Dict
import sqlite3

def record_audit_event(
    conn: sqlite3.Connection,
    actor_username: str,
    actor_role: str,
    action: str,
    target_type: str,
    target_id: str,
    previous_state: Optional[Any] = None,
    resulting_state: Optional[Any] = None,
    details: Optional[Any] = None,
    actor_id: Optional[int] = None,
    ip_address: Optional[str] = "127.0.0.1",
) -> int:
    """
    Appends an immutable audit event to the audit_events table.
    Ensures that past decisions and transitions are transparently preserved.
    """
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    prev_str = json.dumps(previous_state) if isinstance(previous_state, (dict, list)) else (str(previous_state) if previous_state is not None else None)
    res_str = json.dumps(resulting_state) if isinstance(resulting_state, (dict, list)) else (str(resulting_state) if resulting_state is not None else None)
    det_str = json.dumps(details) if isinstance(details, (dict, list)) else (str(details) if details is not None else None)

    cursor.execute("""
    INSERT INTO audit_events (
        timestamp, actor_id, actor_username, actor_role, action,
        target_type, target_id, previous_state, resulting_state, details, ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        now_iso, actor_id, actor_username, actor_role, action,
        target_type, target_id, prev_str, res_str, det_str, ip_address
    ))
    return cursor.lastrowid
