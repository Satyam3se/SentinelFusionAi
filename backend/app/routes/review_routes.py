"""
SentinelFusion AI - Human Review Centre Routes
Guarantees human-in-the-loop control, audit preservation, and mandatory correction justifications.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..models import ReviewDecisionCreate, VerificationRequestCreate
from ..auth import get_current_user, require_role
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event

router = APIRouter(prefix="/api/review", tags=["Human Review"])

VALID_ACTIONS = {
    "ACCEPT_RECOMMENDATION",
    "CORRECT_PRIORITY",
    "CORRECT_CLASSIFICATION",
    "REQUEST_VERIFICATION",
    "MARK_REVIEWED",
    "CLOSE_INCIDENT",
}

@router.get("/queue")
async def get_review_queue(current_user: dict = Depends(get_current_user)):
    """Retrieve incidents requiring human review, ordered by oldest pending first."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT i.*, COUNT(ir.report_id) as total_reports_count
        FROM incidents i
        LEFT JOIN incident_reports ir ON i.incident_id = ir.incident_id
        WHERE i.status IN ('NEW', 'PENDING_REVIEW', 'VERIFICATION_REQUESTED')
        GROUP BY i.incident_id
        ORDER BY
            CASE i.priority
                WHEN 'CRITICAL' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                ELSE 4
            END ASC,
            i.created_at ASC;
        """)
        rows = dicts_from_rows(cursor.fetchall())
        return {
            "queue_count": len(rows),
            "pending_incidents": rows,
            "notice": "Oldest and highest-priority unreviewed incidents prioritized to prevent alert fatigue.",
        }

@router.post("/decide/{incident_id}")
async def submit_review_decision(
    incident_id: str,
    decision: ReviewDecisionCreate,
    current_user: dict = Depends(require_role(["Administrator", "Reviewer"])),
    request: Request = None,
):
    """
    Submits a human review decision.
    MANDATORY RULE: If correcting priority or classification, a non-empty correction_reason is required.
    Does NOT overwrite original heuristic recommendations; preserves complete review decision history.
    """
    if decision.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid review action '{decision.action}'. Must be one of: {', '.join(VALID_ACTIONS)}"
        )

    # Mandatory reason rule
    if decision.action in ["CORRECT_PRIORITY", "CORRECT_CLASSIFICATION"]:
        if not decision.correction_reason or len(decision.correction_reason.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A mandatory explanation (at least 5 characters) is required when correcting system recommendations or priority."
            )

    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE incident_id = ?;", (incident_id,))
        inc = dict_from_row(cursor.fetchone())
        if not inc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident {incident_id} not found.")

        orig_priority = inc["priority"]
        orig_status = inc["status"]
        orig_recommendation = inc["recommendation"]

        # Determine resulting priority and status
        res_priority = decision.resulting_priority or orig_priority
        if decision.action == "ACCEPT_RECOMMENDATION":
            res_status = "REVIEWED_CONFIRMED"
        elif decision.action in ["CORRECT_PRIORITY", "CORRECT_CLASSIFICATION"]:
            res_status = "REVIEWED_CORRECTED"
        elif decision.action == "REQUEST_VERIFICATION":
            res_status = "VERIFICATION_REQUESTED"
        elif decision.action == "MARK_REVIEWED":
            res_status = "REVIEWED_CONFIRMED"
        elif decision.action == "CLOSE_INCIDENT":
            res_status = "CLOSED"
        else:
            res_status = decision.resulting_status or orig_status

        # Update incident record
        cursor.execute("""
        UPDATE incidents SET
            priority = ?,
            status = ?,
            assigned_reviewer_id = ?,
            reviewer_username = ?,
            reviewer_notes = ?,
            correction_reason = ?,
            reviewed_at = ?,
            updated_at = ?
        WHERE incident_id = ?;
        """, (
            res_priority, res_status, current_user["id"], current_user["username"],
            decision.reviewer_notes, decision.correction_reason, now_iso, now_iso,
            incident_id
        ))

        # Append to immutable review_decisions history
        cursor.execute("""
        INSERT INTO review_decisions (
            incident_id, reviewer_id, reviewer_username, reviewer_role, action,
            original_priority, resulting_priority, original_status, resulting_status,
            original_recommendation, correction_reason, notes, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            incident_id, current_user["id"], current_user["username"], current_user["role"],
            decision.action, orig_priority, res_priority, orig_status, res_status,
            orig_recommendation, decision.correction_reason, decision.reviewer_notes, now_iso
        ))

        # Record audit log
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action=f"INCIDENT_{decision.action}", target_type="INCIDENT", target_id=incident_id,
            previous_state={"priority": orig_priority, "status": orig_status},
            resulting_state={"priority": res_priority, "status": res_status},
            details={"reason": decision.correction_reason, "notes": decision.reviewer_notes},
            actor_id=current_user["id"], ip_address=client_ip
        )

        return {
            "status": "SUCCESS",
            "incident_id": incident_id,
            "action": decision.action,
            "resulting_status": res_status,
            "resulting_priority": res_priority,
            "recorded_by": current_user["username"],
            "timestamp": now_iso,
        }

@router.get("/decisions/{incident_id}")
async def get_incident_decision_history(incident_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve full chronological human review decisions for an incident."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM review_decisions
        WHERE incident_id = ?
        ORDER BY timestamp ASC;
        """, (incident_id,))
        return dicts_from_rows(cursor.fetchall())

@router.post("/verification/{incident_id}")
async def submit_verification_request(
    incident_id: str,
    req_body: VerificationRequestCreate,
    current_user: dict = Depends(require_role(["Administrator", "Reviewer", "Analyst"])),
    request: Request = None,
):
    """Submits a verification request for additional sensor coverage or human ground confirmation."""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM incidents WHERE incident_id = ?;", (incident_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Incident {incident_id} not found.")

        cursor.execute("""
        INSERT INTO verification_requests (
            incident_id, requested_by, requested_by_username, target_source_type,
            fictional_zone, specific_questions, priority, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?);
        """, (
            incident_id, current_user["id"], current_user["username"],
            req_body.target_source_type, req_body.fictional_zone,
            req_body.specific_questions, req_body.priority, now_iso
        ))
        req_id = cursor.lastrowid

        cursor.execute("UPDATE incidents SET status = 'VERIFICATION_REQUESTED', updated_at = ? WHERE incident_id = ?;", (now_iso, incident_id))

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="VERIFICATION_REQUEST_SUBMITTED", target_type="INCIDENT", target_id=incident_id,
            details=f"Target: {req_body.target_source_type} in {req_body.fictional_zone}. Questions: {req_body.specific_questions}",
            actor_id=current_user["id"], ip_address=client_ip
        )

        return {
            "status": "VERIFICATION_REQUESTED",
            "verification_request_id": req_id,
            "incident_id": incident_id,
            "timestamp": now_iso,
        }
