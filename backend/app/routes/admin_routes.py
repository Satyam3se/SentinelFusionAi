"""
SentinelFusion AI - User & Role Administration Routes (Administrator Only)
Provides server-enforced RBAC management, account lifecycle, and system metrics.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..models import UserCreate, UserUpdate, UserResponse, DashboardMetrics
from ..auth import get_current_user, require_role, hash_password
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event
from ..config import ROLES

router = APIRouter(prefix="/api/admin", tags=["Administration"])

@router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_role(["Administrator"]))):
    """List all user accounts and their operational roles (Admin only)."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY id ASC;")
        rows = dicts_from_rows(cursor.fetchall())
        return [
            UserResponse(
                id=r["id"],
                username=r["username"],
                email=r["email"],
                full_name=r["full_name"],
                role=r["role"],
                is_active=bool(r["is_active"]),
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                last_login_at=r.get("last_login_at"),
                failed_login_attempts=r.get("failed_login_attempts", 0),
            )
            for r in rows
        ]

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    current_user: dict = Depends(require_role(["Administrator"])),
    request: Request = None,
):
    """Creates a new user account with specified RBAC role (Admin only)."""
    if user_in.role not in ROLES.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_in.role}'. Must be one of: {', '.join(ROLES.values())}"
        )

    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?;", (user_in.username, user_in.email))
        if cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email is already registered.")

        pw_hash, salt = hash_password(user_in.password)
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, salt, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);
        """, (user_in.username, user_in.email, pw_hash, salt, user_in.full_name, user_in.role, now_iso, now_iso))
        new_id = cursor.lastrowid

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="USER_CREATED", target_type="USER", target_id=str(new_id),
            resulting_state={"username": user_in.username, "role": user_in.role},
            details=f"Admin created user {user_in.username} with role {user_in.role}",
            actor_id=current_user["id"], ip_address=client_ip
        )

        cursor.execute("SELECT * FROM users WHERE id = ?;", (new_id,))
        r = dict_from_row(cursor.fetchone())
        return UserResponse(
            id=r["id"],
            username=r["username"],
            email=r["email"],
            full_name=r["full_name"],
            role=r["role"],
            is_active=bool(r["is_active"]),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            last_login_at=r.get("last_login_at"),
            failed_login_attempts=r.get("failed_login_attempts", 0),
        )

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: dict = Depends(require_role(["Administrator"])),
    request: Request = None,
):
    """
    Updates user role or active status.
    Prevents self-deactivation by the administrator to prevent accidental system lockout.
    """
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    now_iso = datetime.now(timezone.utc).isoformat()

    if user_id == current_user["id"] and user_update.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-deactivation is prohibited to prevent administrator lockout."
        )

    if user_update.role and user_update.role not in ROLES.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{user_update.role}'. Must be one of: {', '.join(ROLES.values())}"
        )

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?;", (user_id,))
        existing = dict_from_row(cursor.fetchone())
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found.")

        new_role = user_update.role if user_update.role is not None else existing["role"]
        new_active = int(user_update.is_active) if user_update.is_active is not None else existing["is_active"]
        new_name = user_update.full_name if user_update.full_name is not None else existing["full_name"]

        cursor.execute("""
        UPDATE users SET role = ?, is_active = ?, full_name = ?, updated_at = ?
        WHERE id = ?;
        """, (new_role, new_active, new_name, now_iso, user_id))

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="USER_MODIFIED", target_type="USER", target_id=str(user_id),
            previous_state={"role": existing["role"], "is_active": existing["is_active"]},
            resulting_state={"role": new_role, "is_active": new_active},
            details=f"Admin updated user {existing['username']}",
            actor_id=current_user["id"], ip_address=client_ip
        )

        cursor.execute("SELECT * FROM users WHERE id = ?;", (user_id,))
        r = dict_from_row(cursor.fetchone())
        return UserResponse(
            id=r["id"],
            username=r["username"],
            email=r["email"],
            full_name=r["full_name"],
            role=r["role"],
            is_active=bool(r["is_active"]),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            last_login_at=r.get("last_login_at"),
            failed_login_attempts=r.get("failed_login_attempts", 0),
        )

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(current_user: dict = Depends(get_current_user)):
    """
    Returns dynamically computed application metrics for the Main Intelligence Dashboard.
    Data is computed from actual stored records.
    """
    with db_session() as conn:
        cursor = conn.cursor()

        # Reports count
        cursor.execute("SELECT COUNT(*) FROM reports;")
        total_reports = cursor.fetchone()[0]

        # Incidents count
        cursor.execute("SELECT COUNT(*) FROM incidents;")
        total_incidents = cursor.fetchone()[0]

        # Awaiting verification / review
        cursor.execute("SELECT COUNT(*) FROM incidents WHERE status IN ('NEW', 'PENDING_REVIEW', 'VERIFICATION_REQUESTED');")
        awaiting_review = cursor.fetchone()[0]

        # Data quality warnings
        cursor.execute("SELECT COUNT(*) FROM reports WHERE data_quality_status != 'VALID';")
        dq_warnings = cursor.fetchone()[0]

        # Stale or unavailable sources
        now = datetime.now(timezone.utc)
        cursor.execute("SELECT status, staleness_threshold_sec, last_heartbeat_at FROM sources;")
        stale_or_unavailable = 0
        for s in cursor.fetchall():
            if s["status"] == "UNAVAILABLE":
                stale_or_unavailable += 1
            elif s["last_heartbeat_at"]:
                try:
                    hb = datetime.fromisoformat(s["last_heartbeat_at"].replace("Z", "+00:00"))
                    if (now - hb).total_seconds() > s["staleness_threshold_sec"]:
                        stale_or_unavailable += 1
                except Exception:
                    stale_or_unavailable += 1
            else:
                stale_or_unavailable += 1

        # Human reviewed incidents
        cursor.execute("SELECT COUNT(*) FROM incidents WHERE status IN ('REVIEWED_CONFIRMED', 'REVIEWED_CORRECTED', 'CLOSED');")
        human_reviewed = cursor.fetchone()[0]

        # Incident status distribution
        cursor.execute("SELECT status, COUNT(*) as cnt FROM incidents GROUP BY status;")
        status_dist = {r["status"]: r["cnt"] for r in cursor.fetchall()}

        # Priority distribution
        cursor.execute("SELECT priority, COUNT(*) as cnt FROM incidents GROUP BY priority;")
        priority_dist = {r["priority"]: r["cnt"] for r in cursor.fetchall()}

        # Source type distribution
        cursor.execute("SELECT source_type, COUNT(*) as cnt FROM reports GROUP BY source_type;")
        source_dist = {r["source_type"]: r["cnt"] for r in cursor.fetchall()}

        return DashboardMetrics(
            total_incoming_reports=total_reports,
            candidate_incident_groups=total_incidents,
            reports_awaiting_verification=awaiting_review,
            data_quality_warnings=dq_warnings,
            stale_or_unavailable_sources=stale_or_unavailable,
            human_reviewed_incidents=human_reviewed,
            system_health_status="OPERATIONAL" if stale_or_unavailable <= 2 else "DEGRADED",
            incident_status_distribution=status_dist,
            priority_distribution=priority_dist,
            source_distribution=source_dist,
            last_successful_processing_time=now.isoformat(),
            is_synthetic_environment=True,
        )
