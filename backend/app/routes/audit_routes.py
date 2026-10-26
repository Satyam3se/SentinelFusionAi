"""
SentinelFusion AI - Audit Trail Routes
Provides transparent viewing of immutable audit logs. Editing/deletion endpoints are intentionally prohibited.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from ..models import AuditEventResponse
from ..auth import get_current_user, require_role
from ..database import db_session, dict_from_row, dicts_from_rows

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=Dict[str, Any])
async def list_audit_events(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_role(["Administrator", "Analyst", "Reviewer"])),
):
    """
    Returns paginated append-only audit events.
    Audits preserve user identities, timestamps, previous states, and resulting states.
    """
    with db_session() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM audit_events WHERE 1=1"
        params: List[Any] = []

        if action:
            query += " AND action LIKE ?"
            params.append(f"%{action}%")
        if target_type:
            query += " AND target_type = ?"
            params.append(target_type)
        if actor:
            query += " AND actor_username = ?"
            params.append(actor)

        count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        query += " ORDER BY id DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = dicts_from_rows(cursor.fetchall())

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "events": [AuditEventResponse(**r) for r in rows],
            "security_notice": "Application-level audit protection is active. Deletion/modification of logs is prohibited.",
        }
