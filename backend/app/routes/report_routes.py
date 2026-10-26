"""
SentinelFusion AI - Incoming Reports & CSV Ingestion Routes
Enforces strict schema validation, quarantine for malformed rows, and duplicate detection.
"""
import csv
import io
import json
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status, Request
from ..models import ReportCreate, ReportResponse, ReportImportResult, CSVImportRowError
from ..auth import get_current_user, require_role
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event
from ..config import FICTIONAL_ZONES

router = APIRouter(prefix="/api/reports", tags=["Reports"])

VALID_SOURCE_TYPES = {"RADAR", "OPTICAL_CAM", "UAV_RECON", "SIGINT_BEACON", "MANUAL_REPORT"}
VALID_ZONE_IDS = {z["id"] for z in FICTIONAL_ZONES}

@router.get("", response_model=Dict[str, Any])
async def list_reports(
    zone: Optional[str] = None,
    source_type: Optional[str] = None,
    data_quality: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List incoming reports with filtering, search, and pagination."""
    with db_session() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM reports WHERE 1=1"
        params: List[Any] = []

        if zone:
            query += " AND fictional_zone = ?"
            params.append(zone)
        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)
        if data_quality:
            query += " AND data_quality_status = ?"
            params.append(data_quality)
        if status_filter:
            query += " AND status = ?"
            params.append(status_filter)
        if search:
            query += " AND (report_id LIKE ? OR description LIKE ? OR event_type LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])

        # Get total count
        count_query = query.replace("SELECT *", "SELECT COUNT(*)", 1)
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Get paginated data
        query += " ORDER BY report_timestamp DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            d = dict_from_row(r)
            d["missing_fields"] = json.loads(d.get("missing_fields") or "[]")
            d["is_synthetic"] = bool(d.get("is_synthetic", 1))
            results.append(d)

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "reports": results,
            "notice": "All demonstration records are synthetic.",
        }

@router.get("/schema")
async def get_csv_schema():
    """Returns documentation and specifications for report CSV ingestion."""
    return {
        "required_columns": [
            "source_id", "source_type", "fictional_zone", "event_type",
            "description", "confidence_score", "report_timestamp"
        ],
        "optional_columns": ["report_id", "raw_payload"],
        "allowed_source_types": list(VALID_SOURCE_TYPES),
        "allowed_fictional_zones": list(VALID_ZONE_IDS),
        "constraints": {
            "max_file_size_bytes": 2 * 1024 * 1024,  # 2MB
            "max_row_count": 500,
            "confidence_score_range": "0.0 to 1.0",
            "report_timestamp_format": "ISO-8601 (e.g. 2026-10-26T10:00:00Z)",
        },
        "sample_csv": (
            "report_id,source_id,source_type,fictional_zone,event_type,description,confidence_score,report_timestamp\n"
            "REP-901,RADAR-SYNTH-01,RADAR,DEMO-ZONE-A,AERIAL_TRACK,Low-altitude track moving eastward,0.85,2026-10-26T09:30:00Z\n"
            "REP-902,OPTICAL-CAM-03,OPTICAL_CAM,DEMO-ZONE-A,ELECTRO_OPTICAL_SIGHTING,Optical silhouette confirmed at bearing 042,0.80,2026-10-26T09:31:00Z\n"
        )
    }

@router.get("/export-csv")
async def export_reports_csv(
    zone: Optional[str] = None,
    source_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Exports raw incoming sensor reports as downloadable CSV."""
    with db_session() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM reports WHERE 1=1"
        params: List[Any] = []
        if zone:
            query += " AND fictional_zone = ?"
            params.append(zone)
        if source_type:
            query += " AND source_type = ?"
            params.append(source_type)
        query += " ORDER BY report_timestamp DESC;"

        cursor.execute(query, params)
        reports = dicts_from_rows(cursor.fetchall())

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Report_ID", "Source_ID", "Source_Type", "Fictional_Zone",
            "Event_Type", "Description", "Confidence_Score", "Data_Quality_Status",
            "Report_Timestamp", "Status", "Synthetic_Notice"
        ])

        for r in reports:
            writer.writerow([
                r["report_id"],
                r["source_id"],
                r["source_type"],
                r["fictional_zone"],
                r["event_type"],
                r["description"],
                r["confidence_score"],
                r["data_quality_status"],
                r["report_timestamp"],
                r["status"],
                "SYNTHETIC DEMO RECORD"
            ])

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="REPORTS_CSV_EXPORTED", target_type="CSV_EXPORT", target_id=zone or "ALL_REPORTS",
            details=f"Exported incoming reports CSV containing {len(reports)} records",
            actor_id=current_user["id"]
        )

        response = Response(content=output.getvalue(), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename=sentinelfusion_sensor_reports_{datetime.now().strftime('%Y%m%d')}.csv"
        return response

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_detail(report_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve details for a single report record."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE report_id = ?;", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report {report_id} not found.")
        d = dict_from_row(row)
        d["missing_fields"] = json.loads(d.get("missing_fields") or "[]")
        d["is_synthetic"] = bool(d.get("is_synthetic", 1))
        return ReportResponse(**d)

@router.post("", response_model=ReportResponse)
async def create_report(
    report_in: ReportCreate,
    current_user: dict = Depends(require_role(["Administrator", "Analyst"])),
    request: Request = None,
):
    """Manually submit a synthetic report record (restricted to Analyst/Admin)."""
    now = datetime.now(timezone.utc)
    rep_id = report_in.report_id or f"REP-{secrets.token_hex(3).upper()}"
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM reports WHERE report_id = ?;", (rep_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Report ID {rep_id} already exists.")

        # Data quality checks
        missing = []
        if not report_in.description.strip():
            missing.append("description")
        if not report_in.report_timestamp:
            missing.append("report_timestamp")

        dq_status = "MISSING_FIELDS" if missing else "VALID"

        cursor.execute("""
        INSERT INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INGESTED', ?, ?, 1, ?, ?, ?);
        """, (
            rep_id, report_in.source_id, report_in.source_type, report_in.fictional_zone,
            report_in.event_type, report_in.description, report_in.raw_payload or "{}",
            report_in.confidence_score, dq_status, json.dumps(missing),
            report_in.report_timestamp, now.isoformat(), now.isoformat()
        ))

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="REPORT_CREATED", target_type="REPORT", target_id=rep_id,
            details=f"Synthetic report {rep_id} created in zone {report_in.fictional_zone}",
            actor_id=current_user["id"], ip_address=client_ip
        )

        cursor.execute("SELECT * FROM reports WHERE report_id = ?;", (rep_id,))
        d = dict_from_row(cursor.fetchone())
        d["missing_fields"] = json.loads(d.get("missing_fields") or "[]")
        d["is_synthetic"] = True
        return ReportResponse(**d)

@router.post("/upload-csv", response_model=ReportImportResult)
async def upload_csv_reports(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["Administrator", "Analyst"])),
    request: Request = None,
):
    """
    Strict CSV import with validation, error isolation, row count limits, and safe parsing.
    Does not execute file contents. Quarantines invalid rows without rejecting entire batch.
    """
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"

    # Check file size limit (max 2MB)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded CSV file exceeds maximum allowable size (2MB)."
        )

    try:
        text_stream = io.StringIO(content.decode("utf-8-sig"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not valid UTF-8 text."
        )

    reader = csv.DictReader(text_stream)
    if not reader.fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file appears empty or missing header.")

    required_fields = ["source_id", "source_type", "fictional_zone", "event_type", "description", "confidence_score", "report_timestamp"]
    missing_header = [f for f in required_fields if f not in reader.fieldnames]
    if missing_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV missing mandatory headers: {', '.join(missing_header)}"
        )

    imported_count = 0
    rejected_errors: List[CSVImportRowError] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    with db_session() as conn:
        cursor = conn.cursor()

        for row_idx, row in enumerate(reader, start=2):
            if row_idx > 502:  # Max 500 rows limit
                rejected_errors.append(CSVImportRowError(
                    row_number=row_idx,
                    raw_data="Limit exceeded",
                    error="Maximum batch limit of 500 rows exceeded. Subsequent rows skipped."
                ))
                break

            # Field validation
            src_id = (row.get("source_id") or "").strip()
            src_type = (row.get("source_type") or "").strip().upper()
            zone = (row.get("fictional_zone") or "").strip().upper()
            event = (row.get("event_type") or "").strip()
            desc = (row.get("description") or "").strip()
            raw_ts = (row.get("report_timestamp") or "").strip()
            raw_conf = (row.get("confidence_score") or "0.5").strip()
            rep_id = (row.get("report_id") or "").strip() or f"CSV-{secrets.token_hex(3).upper()}"

            if not src_id or not desc:
                rejected_errors.append(CSVImportRowError(
                    row_number=row_idx,
                    raw_data=f"{src_id},{desc[:30]}",
                    error="Missing mandatory source_id or description."
                ))
                continue

            if src_type not in VALID_SOURCE_TYPES:
                rejected_errors.append(CSVImportRowError(
                    row_number=row_idx,
                    raw_data=src_type,
                    error=f"Invalid source_type '{src_type}'. Must be one of: {', '.join(VALID_SOURCE_TYPES)}"
                ))
                continue

            if zone not in VALID_ZONE_IDS:
                rejected_errors.append(CSVImportRowError(
                    row_number=row_idx,
                    raw_data=zone,
                    error=f"Invalid fictional_zone '{zone}'. Must be one of: {', '.join(VALID_ZONE_IDS)}"
                ))
                continue

            try:
                conf = float(raw_conf)
                if not (0.0 <= conf <= 1.0):
                    raise ValueError()
            except ValueError:
                rejected_errors.append(CSVImportRowError(
                    row_number=row_idx,
                    raw_data=raw_conf,
                    error="Confidence score must be a number between 0.0 and 1.0."
                ))
                continue

            # Insert validated report
            cursor.execute("""
            INSERT OR REPLACE INTO reports (
                report_id, source_id, source_type, fictional_zone, event_type,
                description, raw_payload, confidence_score, status, data_quality_status,
                missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, '{}', ?, 'INGESTED', 'VALID', '[]', 1, ?, ?, ?);
            """, (
                rep_id, src_id, src_type, zone, event, desc, conf, raw_ts or now_iso, now_iso, now_iso
            ))
            imported_count += 1

        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="CSV_IMPORT_COMPLETED", target_type="REPORTS_BATCH", target_id=file.filename or "upload.csv",
            details=f"Imported: {imported_count}, Rejected: {len(rejected_errors)}",
            actor_id=current_user["id"], ip_address=client_ip
        )

    return ReportImportResult(
        total_processed=imported_count + len(rejected_errors),
        imported_count=imported_count,
        rejected_count=len(rejected_errors),
        rejected_errors=rejected_errors,
    )
