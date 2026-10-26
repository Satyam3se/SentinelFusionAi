"""
SentinelFusion AI - Source Health & Data Quality Telemetry Routes
Explicitly distinguishes between 'No report received' and 'Source checked and zero events found'.
Surfaces stale sensors, heartbeats, and missing fields.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..models import SourceHealthResponse
from ..auth import get_current_user, require_role
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event

router = APIRouter(prefix="/api/source-health", tags=["Source Health"])

@router.get("", response_model=Dict[str, Any])
async def get_all_sources_health(current_user: dict = Depends(get_current_user)):
    """
    Returns telemetry status for all configured synthetic demonstration sources.
    Evaluates staleness against individual sensor thresholds.
    """
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sources ORDER BY fictional_zone, source_id ASC;")
        rows = dicts_from_rows(cursor.fetchall())

        now = datetime.now(timezone.utc)
        results: List[SourceHealthResponse] = []
        stale_count = 0
        unavailable_count = 0

        for r in rows:
            is_stale = False
            last_hb_str = r.get("last_heartbeat_at")
            thresh = r.get("staleness_threshold_sec", 300)

            if last_hb_str:
                try:
                    hb_time = datetime.fromisoformat(last_hb_str.replace("Z", "+00:00"))
                    diff_sec = (now - hb_time).total_seconds()
                    if diff_sec > thresh:
                        is_stale = True
                        stale_count += 1
                except Exception:
                    is_stale = True
            else:
                is_stale = True

            if r.get("status") == "UNAVAILABLE":
                unavailable_count += 1

            results.append(SourceHealthResponse(
                source_id=r["source_id"],
                name=r["name"],
                source_type=r["source_type"],
                fictional_zone=r["fictional_zone"],
                status=r["status"],
                staleness_threshold_sec=thresh,
                last_heartbeat_at=r.get("last_heartbeat_at"),
                last_report_at=r.get("last_report_at"),
                total_reports_count=r.get("total_reports_count", 0),
                error_count=r.get("error_count", 0),
                notes=r.get("notes"),
                is_stale=is_stale,
            ))

        # Check total data quality anomalies in reports
        cursor.execute("""
        SELECT data_quality_status, COUNT(*) as cnt
        FROM reports
        GROUP BY data_quality_status;
        """)
        dq_counts = {row["data_quality_status"]: row["cnt"] for row in cursor.fetchall()}

        return {
            "sources": results,
            "summary": {
                "total_sources": len(results),
                "stale_sources": stale_count,
                "unavailable_sources": unavailable_count,
                "online_sources": len(results) - unavailable_count,
                "data_quality_anomalies": dq_counts,
            },
            "critical_distinction_notice": (
                "IMPORTANT ARCHITECTURAL DISTINCTION: 'No report received' does NOT mean "
                "'Source checked and no event found'. Missing reports indicate possible sensor outage, "
                "link degradation, or latency rather than confirmed sector tranquility."
            ),
            "disclaimer": "All sources are synthetic demonstration feeds. Not connected to operational hardware."
        }

@router.post("/{source_id}/heartbeat")
async def send_source_heartbeat(
    source_id: str,
    current_user: dict = Depends(require_role(["Administrator", "Analyst"])),
):
    """Simulates or records an incoming heartbeat for a synthetic sensor."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT source_id FROM sources WHERE source_id = ?;", (source_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Source {source_id} not found.")

        cursor.execute("""
        UPDATE sources SET status = 'ONLINE', last_heartbeat_at = ? WHERE source_id = ?;
        """, (now_iso, source_id))

        return {"source_id": source_id, "status": "ONLINE", "last_heartbeat_at": now_iso}

@router.post("/{source_id}/toggle-status")
async def toggle_source_status(
    source_id: str,
    new_status: str,
    current_user: dict = Depends(require_role(["Administrator"])),
    request: Request = None,
):
    """Simulate source unavailability or maintenance mode (Admin only)."""
    valid_statuses = {"ONLINE", "STALE", "UNAVAILABLE", "MAINTENANCE"}
    if new_status.upper() not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE sources SET status = ? WHERE source_id = ?;", (new_status.upper(), source_id))
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="SOURCE_STATUS_MODIFIED", target_type="SOURCE", target_id=source_id,
            resulting_state=new_status.upper(), details=f"Source {source_id} set to {new_status.upper()}",
            actor_id=current_user["id"], ip_address=client_ip
        )
        return {"source_id": source_id, "status": new_status.upper()}
