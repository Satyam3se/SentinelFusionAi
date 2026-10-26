"""
SentinelFusion AI - Situation Report Generator Routes
Constructs audit-traceable operational situation summaries from actual database records.
Explicitly isolates observed evidence from inferences and marks synthetic demo context.
"""
import io
import csv
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Request
from ..models import SituationReportRequest
from ..auth import get_current_user
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event
from ..config import DISCLAIMER_BANNER

router = APIRouter(prefix="/api/situation-reports", tags=["Situation Reports"])

@router.post("/generate")
async def generate_situation_report(
    params: SituationReportRequest,
    current_user: dict = Depends(get_current_user),
    request: Request = None,
):
    """
    Generates a structured, traceable Situation Report (SITREP) based on stored application state.
    Separates verified facts from unverified alerts and explicitly lists contradictory evidence.
    """
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_session() as conn:
        cursor = conn.cursor()

        # Query incidents
        inc_query = "SELECT * FROM incidents WHERE 1=1"
        inc_params = []
        if params.fictional_zone:
            inc_query += " AND fictional_zone = ?"
            inc_params.append(params.fictional_zone)
        if params.incident_ids:
            placeholders = ",".join(["?"] * len(params.incident_ids))
            inc_query += f" AND incident_id IN ({placeholders})"
            inc_params.extend(params.incident_ids)

        inc_query += " ORDER BY updated_at DESC;"
        cursor.execute(inc_query, inc_params)
        incidents = dicts_from_rows(cursor.fetchall())

        inc_summaries = []
        verified_count = 0
        unverified_count = 0
        all_contradictions = []
        all_missing_evidence = []

        for inc in incidents:
            # Parse json fields safely
            score_comp = json.loads(inc.get("score_components") or "{}")
            conflicts = json.loads(inc.get("conflicting_evidence") or "[]")
            missing = json.loads(inc.get("missing_evidence") or "[]")

            if inc.get("status") in ["REVIEWED_CONFIRMED", "REVIEWED_CORRECTED"]:
                verified_count += 1
            else:
                unverified_count += 1

            if conflicts:
                all_contradictions.extend([{"incident_id": inc["incident_id"], **c} for c in conflicts])
            if missing:
                all_missing_evidence.extend([f"[{inc['incident_id']}] {m}" for m in missing])

            # Query supporting reports
            cursor.execute("""
            SELECT r.report_id, r.source_id, r.source_type, r.fictional_zone,
                   r.event_type, r.description, r.report_timestamp, ir.correlation_rule, ir.is_duplicate
            FROM incident_reports ir
            JOIN reports r ON ir.report_id = r.report_id
            WHERE ir.incident_id = ?
            ORDER BY r.report_timestamp ASC;
            """, (inc["incident_id"],))
            linked_reports = dicts_from_rows(cursor.fetchall())

            # Query review decisions
            cursor.execute("""
            SELECT reviewer_username, action, original_priority, resulting_priority,
                   correction_reason, notes, timestamp
            FROM review_decisions
            WHERE incident_id = ?
            ORDER BY timestamp DESC LIMIT 3;
            """, (inc["incident_id"],))
            decisions = dicts_from_rows(cursor.fetchall())

            inc_summaries.append({
                "incident_id": inc["incident_id"],
                "title": inc["title"],
                "fictional_zone": inc["fictional_zone"],
                "priority": inc["priority"],
                "status": inc["status"],
                "recommendation": inc["recommendation"],
                "heuristic_score": inc["heuristic_score"],
                "score_components": score_comp,
                "reviewer_username": inc.get("reviewer_username"),
                "correction_reason": inc.get("correction_reason"),
                "linked_reports": linked_reports,
                "review_decisions": decisions,
            })

        # Record audit export event
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="SITUATION_REPORT_GENERATED", target_type="SITREP", target_id=params.fictional_zone or "ALL_ZONES",
            details=f"Generated report covering {len(inc_summaries)} incidents",
            actor_id=current_user["id"], ip_address=client_ip
        )

        return {
            "report_id": f"SITREP-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
            "generated_at": now_iso,
            "author": current_user["username"],
            "author_role": current_user["role"],
            "title": params.title,
            "fictional_zone": params.fictional_zone or "All Fictional Sectors",
            "disclaimer": DISCLAIMER_BANNER,
            "metrics": {
                "total_incidents_analyzed": len(inc_summaries),
                "human_verified_incidents": verified_count,
                "unverified_pending_incidents": unverified_count,
                "contradictions_detected_count": len(all_contradictions),
                "missing_evidence_count": len(all_missing_evidence),
            },
            "contradictory_evidence": all_contradictions,
            "missing_evidence": all_missing_evidence,
            "incidents": inc_summaries,
            "known_limitations": [
                "Contains strictly synthetic demonstration telemetry; no real-world tactical intelligence.",
                "Heuristic scores reflect rule-based triage index, NOT calibrated real threat probabilities.",
                "Absence of reported movement does NOT verify absence of physical activity (staleness/coverage gaps).",
                "All operational decisions require authorized human review and ground verification."
            ]
        }

@router.get("/export-csv")
async def export_situation_report_csv(
    zone: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Exports structured situation report data as downloadable CSV."""
    with db_session() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM incidents"
        params = []
        if zone:
            query += " WHERE fictional_zone = ?"
            params.append(zone)
        query += " ORDER BY updated_at DESC;"

        cursor.execute(query, params)
        incidents = dicts_from_rows(cursor.fetchall())

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Incident_ID", "Fictional_Zone", "Title", "Priority", "Status",
            "Recommendation", "Heuristic_Score", "Reviewer", "Correction_Reason", "Updated_At", "Synthetic_Notice"
        ])

        for inc in incidents:
            writer.writerow([
                inc["incident_id"],
                inc["fictional_zone"],
                inc["title"],
                inc["priority"],
                inc["status"],
                inc["recommendation"],
                inc["heuristic_score"],
                inc.get("reviewer_username") or "UNASSIGNED",
                inc.get("correction_reason") or "N/A",
                inc["updated_at"],
                "SYNTHETIC DEMO RECORD"
            ])

        # Record audit export event
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="SITREP_CSV_EXPORTED", target_type="CSV_EXPORT", target_id=zone or "ALL_ZONES",
            details=f"Exported SITREP CSV containing {len(incidents)} incidents",
            actor_id=current_user["id"]
        )

        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=sentinelfusion_sitrep_{datetime.now().strftime('%Y%m%d')}.csv"
        return response
