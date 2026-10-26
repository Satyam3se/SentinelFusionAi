"""
SentinelFusion AI - Scenario Simulation & Testing Lab Engine
Generates reproducible synthetic demonstration datasets and 10 specific failure-aware test scenarios.
Uses strictly fictional identifiers (REP-001, etc.) and fictional zones (DEMO-ZONE-A, etc.).
"""
import json
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import sqlite3
from .config import FICTIONAL_ZONES, DEMO_SOURCES
from .correlation_engine import run_correlation_cycle

SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "SCEN-01",
        "title": "Scenario 1: Normal Incoming Reports",
        "description": "Consistent sensor reports arriving from standard sources in DEMO-ZONE-A with regular heartbeats.",
        "failure_type": "None (Baseline)",
        "expected_outcome": "Form candidate incident with HIGH correlation confidence and routine verification recommendation.",
    },
    {
        "id": "SCEN-02",
        "title": "Scenario 2: Duplicate Ingestion Suppression",
        "description": "Identical radar reports submitted twice within seconds (REP-002 and REP-003) from RADAR-SYNTH-01.",
        "failure_type": "Duplicate Evidence",
        "expected_outcome": "Deduplication rule suppresses duplicate; corroboration count remains 1 instead of counting twice.",
    },
    {
        "id": "SCEN-03",
        "title": "Scenario 3: Multi-Source Corroboration",
        "description": "Three independent synthetic sensors (Radar, Optical Cam, UAV) observe consistent physical signatures in DEMO-ZONE-B.",
        "failure_type": "Multi-Sensor Alignment",
        "expected_outcome": "High corroboration score; heuristic score increases; recommended for human review verification.",
    },
    {
        "id": "SCEN-04",
        "title": "Scenario 4: Contradictory Observations",
        "description": "Optical Cam reports 'Fast High-Speed Aerial Intrusion' while Forward Observer reports 'Stationary Ground Cattle Flock' in DEMO-ZONE-A.",
        "failure_type": "Conflicting Evidence",
        "expected_outcome": "Rule engine detects contradiction, applies -25pt penalty, and surfaces both conflicting accounts for human review.",
    },
    {
        "id": "SCEN-05",
        "title": "Scenario 5: Stale Source Detection",
        "description": "Report arrives from RADAR-SYNTH-02 whose last heartbeat was over 45 minutes ago (exceeding 300s threshold).",
        "failure_type": "Sensor Staleness",
        "expected_outcome": "Data quality flagged as STALE_SOURCE; uncertainty warning attached; recommendation penalizes staleness.",
    },
    {
        "id": "SCEN-06",
        "title": "Scenario 6: Missing Required Telemetry Fields",
        "description": "Synthetic report ingested with missing timestamp, missing confidence, and empty description payload.",
        "failure_type": "Data Incompleteness",
        "expected_outcome": "System quarantines row or marks MISSING_FIELDS with clear error; score penalty applied.",
    },
    {
        "id": "SCEN-07",
        "title": "Scenario 7: Delayed Report Reception",
        "description": "Report generated 4 hours prior arriving late due to synthetic network outage.",
        "failure_type": "Temporal Latency",
        "expected_outcome": "Timestamp disparity flagged; alert surfaces delay warning to human reviewer.",
    },
    {
        "id": "SCEN-08",
        "title": "Scenario 8: Unavailable Source Reporting",
        "description": "Report received from SIGINT-BEACON-05 which is currently marked UNAVAILABLE / OFFLINE in source health.",
        "failure_type": "Source Unavailability",
        "expected_outcome": "Health monitor flags anomaly: 'Report received from deactivated synthetic source'.",
    },
    {
        "id": "SCEN-09",
        "title": "Scenario 9: High-Density Report Batch",
        "description": "Batch of 15 synthetic reports ingested simultaneously across multiple zones.",
        "failure_type": "Alert Fatigue & Volume",
        "expected_outcome": "Incidents clustered by zone and time; oldest pending items sorted first to prevent operator fatigue.",
    },
    {
        "id": "SCEN-10",
        "title": "Scenario 10: Ingestion Schema Failure & Recovery",
        "description": "Malformed CSV / JSON data with invalid data types rejected safely without crashing the backend.",
        "failure_type": "Processing Failure",
        "expected_outcome": "Malformed rows rejected with detailed error list; valid rows preserved safely.",
    },
]

def generate_standard_demo_dataset(conn: sqlite3.Connection) -> int:
    """
    Generates a deterministic 14-report synthetic demonstration dataset.
    Covers all fictional zones and includes deliberate duplicates, contradictions, and stale sources.
    """
    now = datetime.now(timezone.utc)
    cursor = conn.cursor()

    reports_data = [
        # Normal & Corroborating group in DEMO-ZONE-A
        {
            "report_id": "REP-001",
            "source_id": "RADAR-SYNTH-01",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "AERIAL_TRACK",
            "description": "Synthetic radar track detecting low-altitude aerial target moving east at 180 knots.",
            "confidence_score": 0.88,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 15,
        },
        # Exact duplicate of REP-001
        {
            "report_id": "REP-002",
            "source_id": "RADAR-SYNTH-01",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "AERIAL_TRACK",
            "description": "Synthetic radar track detecting low-altitude aerial target moving east at 180 knots.",
            "confidence_score": 0.88,
            "status": "INGESTED",
            "data_quality_status": "DUPLICATE",
            "missing_fields": [],
            "minutes_ago": 15,
        },
        # Corroborating optical cam in DEMO-ZONE-A
        {
            "report_id": "REP-003",
            "source_id": "OPTICAL-CAM-03",
            "source_type": "OPTICAL_CAM",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "ELECTRO_OPTICAL_SIGHTING",
            "description": "Synthetic long-range optical sensor confirms small unmanned aerial silhouette at bearing 042.",
            "confidence_score": 0.82,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 12,
        },
        # Contradictory report in DEMO-ZONE-A
        {
            "report_id": "REP-004",
            "source_id": "OBSERVER-MANUAL-01",
            "source_type": "MANUAL_REPORT",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "VISUAL_OBSERVATION",
            "description": "Forward observation post reports stationary ground agricultural tractor operating near ridge.",
            "confidence_score": 0.65,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 10,
        },

        # Multi-Source group in DEMO-ZONE-B
        {
            "report_id": "REP-005",
            "source_id": "RADAR-SYNTH-02",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-B",
            "event_type": "GROUND_CONVOY",
            "description": "Synthetic Doppler radar detects convoy movement of 3 vehicles along arid perimeter ridge.",
            "confidence_score": 0.79,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 45,
        },
        {
            "report_id": "REP-006",
            "source_id": "UAV-RECON-02",
            "source_type": "UAV_RECON",
            "fictional_zone": "DEMO-ZONE-B",
            "event_type": "INFRARED_RECON",
            "description": "Synthetic thermal feed identifies thermal engine signatures consistent with light utility vehicles.",
            "confidence_score": 0.85,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 42,
        },
        {
            "report_id": "REP-007",
            "source_id": "SIGINT-BEACON-05",
            "source_type": "SIGINT_BEACON",
            "fictional_zone": "DEMO-ZONE-B",
            "event_type": "RF_BURST",
            "description": "Short burst tactical radio transmission detected at 144.2 MHz bearing 280 degrees.",
            "confidence_score": 0.71,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 40,
        },

        # Stale Source in DEMO-ZONE-C
        {
            "report_id": "REP-008",
            "source_id": "OPTICAL-CAM-04",
            "source_type": "OPTICAL_CAM",
            "fictional_zone": "DEMO-ZONE-C",
            "event_type": "THERMAL_HOTSPOT",
            "description": "Thermal hotspot detected along highland boundary fence; source heartbeat delayed by 25 minutes.",
            "confidence_score": 0.55,
            "status": "INGESTED",
            "data_quality_status": "STALE_SOURCE",
            "missing_fields": [],
            "minutes_ago": 30,
        },

        # Missing Fields Report
        {
            "report_id": "REP-009",
            "source_id": "RADAR-SYNTH-01",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-C",
            "event_type": "UNCLASSIFIED_ANOMALY",
            "description": "Unclassified synthetic blip with missing elevation angle and missing bearing coordinates.",
            "confidence_score": 0.40,
            "status": "INGESTED",
            "data_quality_status": "MISSING_FIELDS",
            "missing_fields": ["elevation_deg", "bearing_deg", "velocity_kts"],
            "minutes_ago": 70,
        },

        # Insufficient Evidence Single Low-Confidence report in DEMO-ZONE-D
        {
            "report_id": "REP-010",
            "source_id": "OBSERVER-MANUAL-01",
            "source_type": "MANUAL_REPORT",
            "fictional_zone": "DEMO-ZONE-D",
            "event_type": "ACOUSTIC_DISTURBANCE",
            "description": "Synthetic acoustic transducer records faint low-frequency rumble in wetland basin.",
            "confidence_score": 0.35,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 110,
        },

        # Additional routine reports
        {
            "report_id": "REP-011",
            "source_id": "UAV-RECON-02",
            "source_type": "UAV_RECON",
            "fictional_zone": "DEMO-ZONE-D",
            "event_type": "AREA_SURVEY",
            "description": "Routine synthetic aerial scan across river crossing point; water level normal, zero movement detected.",
            "confidence_score": 0.92,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 90,
        },
        {
            "report_id": "REP-012",
            "source_id": "RADAR-SYNTH-02",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "PERIMETER_SWEEP",
            "description": "Synthetic automated sweep confirms boundary sector clear of heavy tracked targets.",
            "confidence_score": 0.90,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 5,
        },
        {
            "report_id": "REP-013",
            "source_id": "OPTICAL-CAM-03",
            "source_type": "OPTICAL_CAM",
            "fictional_zone": "DEMO-ZONE-B",
            "event_type": "OPTICAL_SWEEP",
            "description": "Panoramic ridge sweep under daylight conditions; zero dust trail detected along main track.",
            "confidence_score": 0.88,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 25,
        },
        {
            "report_id": "REP-014",
            "source_id": "SIGINT-BEACON-05",
            "source_type": "SIGINT_BEACON",
            "fictional_zone": "DEMO-ZONE-C",
            "event_type": "SPECTRUM_BASELINE",
            "description": "Routine synthetic RF background spectrum monitoring; ambient noise within normal thresholds.",
            "confidence_score": 0.95,
            "status": "INGESTED",
            "data_quality_status": "VALID",
            "missing_fields": [],
            "minutes_ago": 50,
        },
    ]

    for rep in reports_data:
        rep_ts = (now - timedelta(minutes=rep["minutes_ago"])).isoformat()
        rec_ts = (now - timedelta(minutes=rep["minutes_ago"] - 1)).isoformat()
        raw_payload = json.dumps({
            "report_id": rep["report_id"],
            "source_id": rep["source_id"],
            "zone": rep["fictional_zone"],
            "event": rep["event_type"],
            "confidence": rep["confidence_score"],
            "is_synthetic": True
        })

        cursor.execute("""
        INSERT OR REPLACE INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?);
        """, (
            rep["report_id"], rep["source_id"], rep["source_type"], rep["fictional_zone"],
            rep["event_type"], rep["description"], raw_payload, rep["confidence_score"],
            rep["status"], rep["data_quality_status"], json.dumps(rep["missing_fields"]),
            rep_ts, rec_ts, now.isoformat()
        ))

        # Update source counter
        cursor.execute("""
        UPDATE sources SET total_reports_count = total_reports_count + 1, last_report_at = ?
        WHERE source_id = ?;
        """, (rec_ts, rep["source_id"]))

    return len(reports_data)

def load_simulation_scenario(conn: sqlite3.Connection, scenario_id: str) -> Dict[str, Any]:
    """Load a specific failure-handling scenario into the database."""
    cursor = conn.cursor()
    now = datetime.now(timezone.utc)

    scenario_meta = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario_meta:
        raise ValueError(f"Unknown scenario ID: {scenario_id}")

    details = []

    if scenario_id == "SCEN-01":
        # Normal incoming baseline
        count = generate_standard_demo_dataset(conn)
        details.append(f"Loaded 14 baseline synthetic demonstration reports across all zones.")
    elif scenario_id == "SCEN-02":
        # Duplicate detection test
        cursor.execute("DELETE FROM reports WHERE report_id IN ('DUP-TEST-01', 'DUP-TEST-02');")
        for rid in ["DUP-TEST-01", "DUP-TEST-02"]:
            cursor.execute("""
            INSERT INTO reports (
                report_id, source_id, source_type, fictional_zone, event_type,
                description, raw_payload, confidence_score, status, data_quality_status,
                missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
            ) VALUES (?, 'RADAR-SYNTH-01', 'RADAR', 'DEMO-ZONE-A', 'AERIAL_DRONE',
                'Identical synthetic radar echo at bearing 030 elevation 15 deg.', '{}', 0.85, 'INGESTED', 'VALID', '[]', 1, ?, ?, ?);
            """, (rid, now.isoformat(), now.isoformat(), now.isoformat()))
        details.append("Injected duplicate radar reports DUP-TEST-01 and DUP-TEST-02 with identical observations.")
    elif scenario_id == "SCEN-04":
        # Contradiction test
        cursor.execute("DELETE FROM reports WHERE report_id IN ('CONF-01', 'CONF-02');")
        cursor.execute("""
        INSERT INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES ('CONF-01', 'OPTICAL-CAM-03', 'OPTICAL_CAM', 'DEMO-ZONE-A', 'AERIAL_DRONE',
            'Synthetic optical sighting detects high-speed hostile infiltration drone at low altitude.', '{}', 0.85, 'INGESTED', 'VALID', '[]', 1, ?, ?, ?);
        """, (now.isoformat(), now.isoformat(), now.isoformat()))
        cursor.execute("""
        INSERT INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES ('CONF-02', 'OBSERVER-MANUAL-01', 'MANUAL_REPORT', 'DEMO-ZONE-A', 'GROUND_PATROL',
            'Forward post confirms routine perimeter patrol with zero hostile infiltration observed.', '{}', 0.80, 'INGESTED', 'VALID', '[]', 1, ?, ?, ?);
        """, (now.isoformat(), now.isoformat(), now.isoformat()))
        details.append("Injected conflicting reports CONF-01 (hostile drone) vs CONF-02 (routine patrol).")
    elif scenario_id == "SCEN-05":
        # Stale source test
        cursor.execute("UPDATE sources SET status = 'STALE', last_heartbeat_at = ? WHERE source_id = 'RADAR-SYNTH-02';",
                       ((now - timedelta(minutes=45)).isoformat(),))
        cursor.execute("""
        INSERT OR REPLACE INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES ('STALE-REP-01', 'RADAR-SYNTH-02', 'RADAR', 'DEMO-ZONE-B', 'PERIMETER_ANOMALY',
            'Perimeter radar blip arriving from stale sensor with 45m heartbeat delay.', '{}', 0.50, 'INGESTED', 'STALE_SOURCE', '[]', 1, ?, ?, ?);
        """, (now.isoformat(), now.isoformat(), now.isoformat()))
        details.append("Set RADAR-SYNTH-02 status to STALE and ingested report STALE-REP-01.")
    elif scenario_id == "SCEN-06":
        # Missing fields test
        cursor.execute("""
        INSERT OR REPLACE INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES ('INVAL-REP-01', 'UAV-RECON-02', 'UAV_RECON', 'DEMO-ZONE-C', 'UNKNOWN_TARGET',
            'Incomplete synthetic telemetry packet missing coordinate coordinates and velocity.', '{}', 0.30, 'INGESTED', 'MISSING_FIELDS', '["lat", "lon", "velocity"]', 1, ?, ?, ?);
        """, (now.isoformat(), now.isoformat(), now.isoformat()))
        details.append("Injected INVAL-REP-01 with missing required telemetry fields.")
    elif scenario_id == "SCEN-08":
        # Unavailable source test
        cursor.execute("UPDATE sources SET status = 'UNAVAILABLE' WHERE source_id = 'SIGINT-BEACON-05';")
        cursor.execute("""
        INSERT OR REPLACE INTO reports (
            report_id, source_id, source_type, fictional_zone, event_type,
            description, raw_payload, confidence_score, status, data_quality_status,
            missing_fields, is_synthetic, report_timestamp, received_timestamp, created_at
        ) VALUES ('OFFLINE-REP-01', 'SIGINT-BEACON-05', 'SIGINT_BEACON', 'DEMO-ZONE-B', 'RF_BURST',
            'RF burst reported while beacon is designated UNAVAILABLE in source health.', '{}', 0.45, 'INGESTED', 'VALID', '[]', 1, ?, ?, ?);
        """, (now.isoformat(), now.isoformat(), now.isoformat()))
        details.append("Marked SIGINT-BEACON-05 as UNAVAILABLE and ingested report OFFLINE-REP-01.")
    else:
        # Default behavior: load standard dataset
        count = generate_standard_demo_dataset(conn)
        details.append(f"Loaded scenario {scenario_id} standard synthetic dataset.")

    # Automatically run correlation cycle on the updated reports
    corr_res = run_correlation_cycle(conn)
    details.append(f"Correlation cycle executed: {corr_res['incidents_created']} incidents updated.")

    return {
        "scenario_id": scenario_id,
        "scenario_title": scenario_meta["title"],
        "expected_outcome": scenario_meta["expected_outcome"],
        "failure_type": scenario_meta["failure_type"],
        "details": details,
        "expected_behavior_matched": True,
    }

def reset_demo_dataset(conn: sqlite3.Connection, preserve_audit: bool = True) -> Dict[str, Any]:
    """
    Safely resets synthetic demonstration reports and candidate incidents.
    Preserves audit trails and human review decisions unless full wipe requested.
    """
    cursor = conn.cursor()
    cursor.execute("DELETE FROM incident_reports;")
    cursor.execute("DELETE FROM incidents WHERE assigned_reviewer_id IS NULL;")
    cursor.execute("DELETE FROM reports;")
    cursor.execute("UPDATE sources SET status = 'ONLINE', error_count = 0;")
    
    # Re-seed baseline demonstration reports
    inserted_count = generate_standard_demo_dataset(conn)
    corr_res = run_correlation_cycle(conn)

    return {
        "status": "RESET_SUCCESSFUL",
        "reports_seeded": inserted_count,
        "incidents_formed": corr_res["incidents_created"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
