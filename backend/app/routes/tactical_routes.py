"""
SentinelFusion AI - Tactical Radar Scope & Course of Action (COA) Engine
Provides polar radar tracking, EW spoofing anomaly detection, and decision-support Courses of Action.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..auth import get_current_user, require_role
from ..database import db_session, dict_from_row, dicts_from_rows
from ..audit import record_audit_event

router = APIRouter(prefix="/api/tactical", tags=["Tactical Radar & COA"])

class ExecuteCoaRequest(BaseModel):
    contact_id: str
    incident_id: Optional[str] = None
    coa_id: str
    coa_name: str
    action_type: str
    officer_justification: str = Field(..., min_length=5, max_length=500)

@router.get("/radar-contacts", response_model=Dict[str, Any])
async def get_radar_contacts(current_user: dict = Depends(get_current_user)):
    """
    Returns live tactical radar contacts projected from current correlated incidents and sensor feeds.
    Includes polar coordinates (bearing, range), EW spoofing metrics, and synthesized Courses of Action.
    """
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents ORDER BY updated_at DESC LIMIT 10;")
        incidents = dicts_from_rows(cursor.fetchall())

        # Generate realistic polar radar positions mapped to fictional zones
        # Zone A: North (000°-090°), Zone B: East (090°-180°), Zone C: South (180°-270°), Zone D: West (270°-360°)
        contacts = []
        zone_bearing_map = {
            "DEMO-ZONE-A": {"base_bearing": 35, "base_range": 14.2, "name": "Northern Ridge Sector"},
            "DEMO-ZONE-B": {"base_bearing": 115, "base_range": 28.5, "name": "Eastern Valley Pass"},
            "DEMO-ZONE-C": {"base_bearing": 210, "base_range": 37.0, "name": "Southern Desert Rim"},
            "DEMO-ZONE-D": {"base_bearing": 295, "base_range": 9.8, "name": "Western Riverine Basin"},
        }

        for idx, inc in enumerate(incidents):
            zone = inc.get("fictional_zone", "DEMO-ZONE-A")
            z_info = zone_bearing_map.get(zone, {"base_bearing": 45, "base_range": 15.0, "name": "Tactical Sector"})
            
            # Polar coordinates
            bearing = (z_info["base_bearing"] + (idx * 18)) % 360
            range_km = round(z_info["base_range"] + (idx * 3.5) % 30 + 3.0, 1)

            # Heuristic threat and classification
            priority = inc.get("priority", "MEDIUM")
            correlation_match = inc.get("correlation_confidence", "POSSIBLE_RELATIONSHIP")
            is_contradiction = correlation_match == "CONTRADICTORY_EVIDENCE"

            # Electronic Warfare (EW) Spoofing analysis
            ew_spoofing_risk = 74 if is_contradiction else (45 if priority == "HIGH" else 15)
            sensor_trust = 38 if is_contradiction else (92 if priority == "LOW" else 78)

            # Dynamic AI Advisory Courses of Action (COA)
            if is_contradiction:
                coas = [
                    {
                        "coa_id": "COA-REC-01",
                        "name": "Deploy Heron-Class UAV (Visual Verification)",
                        "action_type": "RECONNAISSANCE",
                        "summary": f"Dispatch UAV flight to {zone} to resolve optical vs scout patrol contradiction.",
                        "risk_level": "LOW",
                        "readiness_time": "3 mins",
                        "recommended": True,
                        "pros": "Zero kinetic escalation; establishes ground truth without exposing infantry.",
                        "cons": "Weather-dependent; battery loiter time limited to 4 hours."
                    },
                    {
                        "coa_id": "COA-EW-02",
                        "name": "Activate Directional Anti-UAS Jamming",
                        "action_type": "ELECTRONIC_WARFARE",
                        "summary": "Sever suspect drone C2 frequency and GNSS receiver using sector jamming array.",
                        "risk_level": "MEDIUM",
                        "readiness_time": "Immediate",
                        "recommended": False,
                        "pros": "Immediate neutralisation without ammunition expenditure.",
                        "cons": "May degrade friendly SIGINT receivers in adjacent sectors."
                    },
                    {
                        "coa_id": "COA-INT-03",
                        "name": "Deploy Quick Reaction Team (QRT) Ground Intercept",
                        "action_type": "GROUND_INTERCEPT",
                        "summary": "Scramble mechanized infantry patrol from Forward Base to secure ridge perimeter.",
                        "risk_level": "HIGH",
                        "readiness_time": "8 mins",
                        "recommended": False,
                        "pros": "Secures ground perimeter and captures potential infiltrators.",
                        "cons": "Exposes troops if target is false alarm or ambush."
                    }
                ]
            elif priority in ["CRITICAL", "HIGH"]:
                coas = [
                    {
                        "coa_id": "COA-INT-01",
                        "name": "Forward Cordon & High-Alert Stance",
                        "action_type": "GROUND_DEFENCE",
                        "summary": f"Establish immediate roadblock and perimeter observation post at {zone}.",
                        "risk_level": "MEDIUM",
                        "readiness_time": "5 mins",
                        "recommended": True,
                        "pros": "Prevents penetration of border buffer zone.",
                        "cons": "Requires shifting forward reserves."
                    },
                    {
                        "coa_id": "COA-REC-02",
                        "name": "High-Altitude Optical Tracking Sweep",
                        "action_type": "RECONNAISSANCE",
                        "summary": "Direct thermal pan-tilt-zoom camera array for continuous tracking.",
                        "risk_level": "LOW",
                        "readiness_time": "Immediate",
                        "recommended": False,
                        "pros": "Passively tracks speed and trajectory with zero operational footprint.",
                        "cons": "Line of sight may be obstructed by ridge topology."
                    },
                    {
                        "coa_id": "COA-EW-03",
                        "name": "Electronic Warfare Spectrum Surveillance",
                        "action_type": "ELECTRONIC_WARFARE",
                        "summary": "Lock RF direction-finding antenna onto target emissions to identify control node.",
                        "risk_level": "LOW",
                        "readiness_time": "1 min",
                        "recommended": False,
                        "pros": "Traces enemy command and control base station location.",
                        "cons": "Ineffective if target operates in radio silence."
                    }
                ]
            else:
                coas = [
                    {
                        "coa_id": "COA-MON-01",
                        "name": "Routine Telemetry Monitoring",
                        "action_type": "SURVEILLANCE",
                        "summary": f"Maintain standard periodic automated radar track sweeps over {zone}.",
                        "risk_level": "LOW",
                        "readiness_time": "Active",
                        "recommended": True,
                        "pros": "Zero resource strain; preserves tactical energy.",
                        "cons": "Target could change heading without rapid alert."
                    },
                    {
                        "coa_id": "COA-REC-02",
                        "name": "Cross-Correlate with Next Patrol Heartbeat",
                        "action_type": "RECONNAISSANCE",
                        "summary": "Request scheduled patrol report at next radio check-in window.",
                        "risk_level": "LOW",
                        "readiness_time": "15 mins",
                        "recommended": False,
                        "pros": "Verifies tranquility with standard patrol cadence.",
                        "cons": "Delayed situational confirmation."
                    }
                ]

            contacts.append({
                "contact_id": f"TRK-{101 + idx}",
                "incident_id": inc.get("incident_id"),
                "callsign": f"CONTACT-{chr(65 + idx)}-{inc.get('fictional_zone')[-1]}",
                "title": inc.get("title"),
                "sector": zone,
                "sector_name": z_info["name"],
                "bearing_deg": bearing,
                "range_km": range_km,
                "altitude_m": 240 + (idx * 310) % 2500 if "Aerial" in inc.get("title", "") else 0,
                "speed_kmh": 220 + (idx * 45) % 280 if "Aerial" in inc.get("title", "") else 42,
                "priority": priority,
                "status": inc.get("status"),
                "correlation_confidence": correlation_match,
                "is_contradiction": is_contradiction,
                "ew_spoofing_risk": ew_spoofing_risk,
                "sensor_trust_index": sensor_trust,
                "heuristic_score": inc.get("heuristic_score", 50),
                "recommended_coas": coas,
                "updated_at": inc.get("updated_at"),
            })

        return {
            "radar_center": {
                "station_name": "BHARAT C2 TACTICAL RADAR STATION - DELTA",
                "lat": 34.0837,
                "lon": 74.7973,
                "max_range_km": 50,
                "sweep_rate_rpm": 12,
                "radar_mode": "ACTIVE_PHASED_ARRAY_SEARCH",
            },
            "contacts_count": len(contacts),
            "contacts": contacts,
            "sectors": [
                {"id": "DEMO-ZONE-A", "name": "Northern Ridge Sector", "bearing_range": "000° - 090°", "threat_level": "ELEVATED"},
                {"id": "DEMO-ZONE-B", "name": "Eastern Valley Pass", "bearing_range": "090° - 180°", "threat_level": "MODERATE"},
                {"id": "DEMO-ZONE-C", "name": "Southern Desert Rim", "bearing_range": "180° - 270°", "threat_level": "NORMAL"},
                {"id": "DEMO-ZONE-D", "name": "Western Riverine Basin", "bearing_range": "270° - 360°", "threat_level": "ELEVATED"},
            ],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

@router.post("/execute-coa", status_code=status.HTTP_200_OK)
async def execute_course_of_action(
    req: ExecuteCoaRequest,
    request: Request,
    current_user: dict = Depends(require_role(["Administrator", "Analyst", "Reviewer"])),
):
    """
    Enforces Human-in-the-Loop decision sign-off for an AI-recommended Course of Action (COA).
    Logs immutable cryptographic audit event and returns mission execution receipt.
    """
    with db_session() as conn:
        cursor = conn.cursor()

        # Update associated incident if present
        if req.incident_id:
            cursor.execute(
                """
                UPDATE incidents 
                SET reviewer_notes = ?, 
                    status = 'REVIEWED_CONFIRMED',
                    updated_at = ?
                WHERE incident_id = ?;
                """,
                (
                    f"COA Executed: [{req.coa_id}] {req.coa_name}. Officer Note: {req.officer_justification}",
                    datetime.now(timezone.utc).isoformat(),
                    req.incident_id
                )
            )

        # Record immutable audit event
        record_audit_event(
            conn=conn,
            actor_username=current_user.get("username", "system"),
            actor_role=current_user.get("role", "Officer"),
            action="TACTICAL_COA_EXECUTED",
            target_type="TACTICAL_CONTACT",
            target_id=req.contact_id,
            resulting_state={"status": "COA_ORDER_TRANSMITTED", "coa_id": req.coa_id, "coa_name": req.coa_name},
            details={
                "incident_id": req.incident_id,
                "coa_id": req.coa_id,
                "coa_name": req.coa_name,
                "action_type": req.action_type,
                "officer_justification": req.officer_justification,
                "officer_name": current_user.get("full_name"),
                "officer_role": current_user.get("role"),
            },
            actor_id=current_user.get("id"),
            ip_address=request.client.host if request.client else "127.0.0.1",
        )

        return {
            "status": "COA_ORDER_TRANSMITTED",
            "contact_id": req.contact_id,
            "incident_id": req.incident_id,
            "coa_id": req.coa_id,
            "coa_name": req.coa_name,
            "authorized_by": f"{current_user.get('full_name')} ({current_user.get('role')})",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "execution_receipt": f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{req.coa_id}",
            "message": f"Course of Action '{req.coa_name}' has been authenticated and transmitted to tactical units.",
        }
