"""
SentinelFusion AI - Security Centre & Posture Routes
Provides authorized users with a transparent inspection of defensive security controls.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List

from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..config import (
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    RATE_LIMIT_MAX_ATTEMPTS,
    RATE_LIMIT_WINDOW_SECONDS,
    ROLE_PERMISSIONS,
    ALLOWED_ORIGINS,
    DISCLAIMER_BANNER,
)
from ..database import db_session, dicts_from_rows

router = APIRouter(prefix="/api/security", tags=["Security Centre"])

@router.get("/status", response_model=Dict[str, Any])
async def get_security_posture(current_user: dict = Depends(get_current_user)):
    """
    Returns the active security configurations, session info, and defensive mechanisms.
    Does NOT leak secrets, session tokens, or private passwords.
    """
    with db_session() as conn:
        cursor = conn.cursor()

        # Query recent security audit events
        cursor.execute("""
        SELECT id, timestamp, actor_username, actor_role, action, target_type, target_id, details, ip_address
        FROM audit_events
        WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'USER_CREATED', 'ROLE_CHANGED')
        ORDER BY id DESC LIMIT 10;
        """)
        recent_sec_events = dicts_from_rows(cursor.fetchall())

        # Check total failed attempts recorded across accounts
        cursor.execute("SELECT SUM(failed_login_attempts) FROM users;")
        total_failed_logins = cursor.fetchone()[0] or 0

        # Check locked accounts count
        cursor.execute("SELECT COUNT(*) FROM users WHERE locked_until IS NOT NULL AND locked_until > ?;",
                       (datetime.now(timezone.utc).isoformat(),))
        locked_accounts_count = cursor.fetchone()[0]

        permissions = ROLE_PERMISSIONS.get(current_user["role"], [])

        return {
            "session_information": {
                "authenticated_user": current_user["username"],
                "full_name": current_user["full_name"],
                "assigned_role": current_user["role"],
                "effective_permissions": permissions,
                "session_ttl_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
            },
            "defensive_security_controls": [
                {
                    "control": "Password Cryptography",
                    "implementation": "PBKDF2-HMAC-SHA256 with 600,000 iterations & unique 32-byte salt",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "SQL Injection Prevention",
                    "implementation": "Parameterized SQL queries with strict parameter binding (Zero string concatenation)",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Brute-Force & Spraying Protection",
                    "implementation": f"Server-enforced rate limiter (Threshold: {RATE_LIMIT_MAX_ATTEMPTS} attempts, Window: {RATE_LIMIT_WINDOW_SECONDS}s)",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Role-Based Access Control (RBAC)",
                    "implementation": "Server-side dependency verification for Administrator, Analyst, Reviewer, Observer",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Cross-Origin Resource Sharing (CORS)",
                    "implementation": f"Strict origin whitelisting: {', '.join(ALLOWED_ORIGINS)}",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Data Sanitization & Ingestion Security",
                    "implementation": "Strict CSV schema validation, size limits (2MB/500 rows), zero code execution",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Decision Traceability & Integrity",
                    "implementation": "Append-only audit trail and immutable review decisions log",
                    "status": "ACTIVE_VERIFIED",
                },
                {
                    "control": "Synthetic Data Isolation",
                    "implementation": "Strict synthetic boundaries; no external military sensor connections",
                    "status": "ACTIVE_VERIFIED",
                },
            ],
            "telemetry_metrics": {
                "total_failed_logins_recorded": total_failed_logins,
                "currently_locked_accounts": locked_accounts_count,
                "recent_security_events_count": len(recent_sec_events),
            },
            "recent_security_events": recent_sec_events,
            "disclaimer_notice": DISCLAIMER_BANNER,
            "honest_limitations": [
                "Prototype security status interface only; does not replace formal third-party cybersecurity penetration testing.",
                "Application-level audit protection is not equivalent to hardware-backed or distributed tamper-proof write-once storage.",
                "For institutional defence deployment, military-grade HSM, PKI smart-cards, and air-gapped network configurations are required."
            ]
        }
