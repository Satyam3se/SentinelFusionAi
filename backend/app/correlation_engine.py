"""
SentinelFusion AI - Deterministic Correlation & Explainable Rules Engine
Implements Failure-Aware Decision Support:
- Detects exact duplicates and suppresses false corroboration
- Identifies spatial-temporal candidate groupings
- Detects contradictory observations across multiple sources
- Surfaces source staleness and missing data
- Calculates explainable heuristic score components (heuristic, not calibrated threat probability)
- Outputs explicit 'INSUFFICIENT_EVIDENCE' when evidence is weak or uncorroborated
"""
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
import sqlite3

logger = logging.getLogger("sentinelfusion.correlation")

# Zone base risk factors for heuristic scoring (0 to 25 points)
ZONE_BASE_RISK = {
    "DEMO-ZONE-A": 22.0,  # Mountainous sector (higher vulnerability)
    "DEMO-ZONE-B": 15.0,  # Arid ridge
    "DEMO-ZONE-C": 10.0,  # Plateau scrubland
    "DEMO-ZONE-D": 18.0,  # Riverine outpost
}

def parse_iso_ts(ts_str: str) -> Optional[datetime]:
    """Parse ISO timestamp string safely."""
    try:
        # Handle trailing Z or timezone offsets
        clean_ts = ts_str.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_ts)
    except Exception:
        return None

def is_exact_duplicate(r1: Dict[str, Any], r2: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Check if two reports are duplicates of the same observation:
    - Same description / raw_payload hash
    - Or same source_id and event_type within a 15-second window.
    """
    # Identical description
    if r1["description"].strip().lower() == r2["description"].strip().lower() and r1["fictional_zone"] == r2["fictional_zone"]:
        return True, "Identical description and fictional zone across records."

    # Same source reporting identical event type within 30 seconds
    if r1["source_id"] == r2["source_id"] and r1["event_type"] == r2["event_type"]:
        t1 = parse_iso_ts(r1["report_timestamp"])
        t2 = parse_iso_ts(r2["report_timestamp"])
        if t1 and t2 and abs((t1 - t2).total_seconds()) <= 30:
            return True, f"Rapid duplicate transmission from identical source ({r1['source_id']}) within 30 seconds."

    return False, ""

def are_contradictory(r1: Dict[str, Any], r2: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Check if two reports present conflicting physical or tactical observations
    at approximately the same time in the same zone.
    Example: One source reports 'High-Speed Aerial Intrusion' while another reports
    'Benign Grazing Animal / Civilian Agricultural Activity'.
    """
    if r1["fictional_zone"] != r2["fictional_zone"]:
        return False, ""

    d1 = r1["description"].lower()
    d2 = r2["description"].lower()

    contradiction_pairs = [
        ("aerial", "stationary ground"),
        ("drone", "civilian flock"),
        ("high-speed", "slow pedestrian"),
        ("armed movement", "agricultural tractor"),
        ("hostile infiltration", "routine perimeter patrol"),
        ("unidentified vehicle", "no vehicle detected"),
    ]

    for p1, p2 in contradiction_pairs:
        if (p1 in d1 and p2 in d2) or (p2 in d1 and p1 in d2):
            return True, f"Conflict detected: Source {r1['source_id']} reports '{p1}' while Source {r2['source_id']} reports '{p2}'."

    return False, ""

def compute_heuristic_score(
    zone: str,
    unique_sources_count: int,
    total_valid_reports: int,
    avg_confidence: float,
    has_contradictions: bool,
    has_stale_source: bool,
    has_missing_fields: bool,
) -> Tuple[float, Dict[str, Any]]:
    """
    Computes explainable heuristic score components.
    IMPORTANT: This score is a deterministic rule-based priority metric,
    NOT a calibrated probability of a real-world military threat.
    """
    zone_risk = ZONE_BASE_RISK.get(zone, 12.0)
    
    # Corroboration score: reward independent sources, up to 30 pts
    # Note: Duplicates do not add to unique_sources_count!
    corroboration_score = min(30.0, unique_sources_count * 10.0)
    
    # Confidence weight: up to 20 pts
    confidence_weight = avg_confidence * 20.0
    
    # Temporal / report density weight: up to 15 pts
    density_weight = min(15.0, total_valid_reports * 3.5)
    
    # Penalties
    conflict_penalty = -25.0 if has_contradictions else 0.0
    staleness_penalty = -15.0 if has_stale_source else 0.0
    missing_fields_penalty = -10.0 if has_missing_fields else 0.0

    raw_total = (
        zone_risk +
        corroboration_score +
        confidence_weight +
        density_weight +
        conflict_penalty +
        staleness_penalty +
        missing_fields_penalty
    )

    final_score = max(5.0, min(95.0, round(raw_total, 1)))

    breakdown = {
        "zone_risk_score": zone_risk,
        "corroboration_score": corroboration_score,
        "unique_sources_count": unique_sources_count,
        "confidence_weight": round(confidence_weight, 1),
        "density_weight": round(density_weight, 1),
        "conflict_penalty": conflict_penalty,
        "staleness_penalty": staleness_penalty,
        "missing_fields_penalty": missing_fields_penalty,
        "formula": "Score = ZoneRisk + Corroboration + ConfidenceWeight + Density - Penalties",
        "notice": "Heuristic composite index for triage ranking. Not a calibrated threat probability."
    }

    return final_score, breakdown

def run_correlation_cycle(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Executes a complete correlation analysis run across all ingested reports.
    Groups reports by fictional zone and temporal proximity.
    Separates duplicates from corroborating observations.
    Flags contradictions and insufficient evidence.
    """
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.*, s.status as source_status, s.staleness_threshold_sec, s.last_heartbeat_at
    FROM reports r
    LEFT JOIN sources s ON r.source_id = s.source_id
    ORDER BY r.fictional_zone, r.report_timestamp ASC;
    """)
    all_reports = [dict(r) for r in cursor.fetchall()]

    if not all_reports:
        return {
            "status": "COMPLETED",
            "message": "No reports available for correlation analysis.",
            "incidents_created": 0,
            "reports_analyzed": 0,
        }

    # Group reports by fictional zone
    zone_groups: Dict[str, List[Dict[str, Any]]] = {}
    for rep in all_reports:
        z = rep["fictional_zone"]
        zone_groups.setdefault(z, []).append(rep)

    incidents_created_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    # Clear previous synthetic candidate incidents for a clean re-run
    # while preserving reviewer decisions if linked
    cursor.execute("SELECT incident_id FROM review_decisions;")
    decided_incidents = {r[0] for r in cursor.fetchall()}

    for zone, reports in zone_groups.items():
        # Form temporal clusters (e.g. observations within 3 hours of each other)
        clusters: List[List[Dict[str, Any]]] = []
        current_cluster: List[Dict[str, Any]] = []

        for rep in reports:
            if not current_cluster:
                current_cluster.append(rep)
            else:
                last_ts = parse_iso_ts(current_cluster[-1]["report_timestamp"])
                rep_ts = parse_iso_ts(rep["report_timestamp"])
                if last_ts and rep_ts and abs((rep_ts - last_ts).total_seconds()) <= 10800:  # 3 hours
                    current_cluster.append(rep)
                else:
                    clusters.append(current_cluster)
                    current_cluster = [rep]
        if current_cluster:
            clusters.append(current_cluster)

        # Process each cluster into candidate incidents
        for idx, cluster in enumerate(clusters, start=1):
            cluster_id_suffix = f"{zone.replace('DEMO-', '')}-{idx:02d}"
            incident_id = f"INC-2026-{cluster_id_suffix}"

            # Check duplicate pairs inside cluster
            duplicates_set = set()
            corroborating_sources = set()
            conflicts_list = []
            missing_evidence_list = []
            has_stale_source = False
            has_missing_fields = False

            n = len(cluster)
            for i in range(n):
                r1 = cluster[i]
                if r1["data_quality_status"] == "MISSING_FIELDS":
                    has_missing_fields = True
                    missing_evidence_list.append(f"Report {r1['report_id']} missing required telemetry fields.")

                if r1["source_status"] == "STALE" or r1["data_quality_status"] == "STALE_SOURCE":
                    has_stale_source = True
                    missing_evidence_list.append(f"Source {r1['source_id']} has not provided recent heartbeats.")

                for j in range(i + 1, n):
                    r2 = cluster[j]
                    # Check exact duplicate
                    is_dup, dup_reason = is_exact_duplicate(r1, r2)
                    if is_dup:
                        duplicates_set.add(r2["report_id"])
                    
                    # Check contradiction
                    is_conflict, conflict_reason = are_contradictory(r1, r2)
                    if is_conflict:
                        conflicts_list.append({
                            "report_a": r1["report_id"],
                            "source_a": r1["source_id"],
                            "report_b": r2["report_id"],
                            "source_b": r2["source_id"],
                            "explanation": conflict_reason,
                        })

                if r1["report_id"] not in duplicates_set:
                    corroborating_sources.add(r1["source_id"])

            total_valid_reports = len(cluster) - len(duplicates_set)
            unique_sources_count = len(corroborating_sources)
            avg_conf = sum(r["confidence_score"] for r in cluster) / len(cluster) if cluster else 0.5
            has_contradictions = len(conflicts_list) > 0

            # Determine Recommendation & Correlation Confidence
            if len(cluster) == 1 and cluster[0]["confidence_score"] < 0.6:
                correlation_confidence = "INSUFFICIENT_EVIDENCE"
                recommendation = "INSUFFICIENT_EVIDENCE"
                priority = "LOW"
            elif has_contradictions:
                correlation_confidence = "CONTRADICTORY_EVIDENCE"
                recommendation = "CORRELATION_CONFLICT"
                priority = "MEDIUM"
            elif unique_sources_count >= 2:
                correlation_confidence = "CONFIRMED_DATA_MATCH"
                recommendation = "PROCEED_VERIFICATION"
                priority = "HIGH" if zone in ["DEMO-ZONE-A", "DEMO-ZONE-D"] else "MEDIUM"
            elif len(duplicates_set) > 0 and unique_sources_count == 1:
                correlation_confidence = "DUPLICATE_RECORD"
                recommendation = "DISMISS_DUPLICATE"
                priority = "LOW"
            else:
                correlation_confidence = "POSSIBLE_RELATIONSHIP"
                recommendation = "ROUTINE_MONITORING"
                priority = "MEDIUM"

            # Compute Heuristic Score
            heuristic_score, score_breakdown = compute_heuristic_score(
                zone=zone,
                unique_sources_count=unique_sources_count,
                total_valid_reports=total_valid_reports,
                avg_confidence=avg_conf,
                has_contradictions=has_contradictions,
                has_stale_source=has_stale_source,
                has_missing_fields=has_missing_fields,
            )

            # Build incident title
            primary_event = cluster[0]["event_type"].replace("_", " ").title()
            title = f"{primary_event} Activity Cluster in {zone}"

            source_health_summary = {
                "total_reports": len(cluster),
                "unique_sources": unique_sources_count,
                "duplicates_detected": len(duplicates_set),
                "has_stale_source": has_stale_source,
                "has_missing_fields": has_missing_fields,
            }

            # Upsert incident record
            cursor.execute("SELECT id, status, reviewer_notes, correction_reason FROM incidents WHERE incident_id = ?;", (incident_id,))
            existing = cursor.fetchone()

            if existing:
                # If already reviewed, do not overwrite reviewer status or notes
                current_status = existing["status"]
                cursor.execute("""
                UPDATE incidents SET
                    title = ?, fictional_zone = ?, priority = ?,
                    correlation_confidence = ?, recommendation = ?, heuristic_score = ?,
                    score_components = ?, conflicting_evidence = ?, missing_evidence = ?,
                    source_health_summary = ?, updated_at = ?
                WHERE incident_id = ?;
                """, (
                    title, zone, priority,
                    correlation_confidence, recommendation, heuristic_score,
                    json.dumps(score_breakdown), json.dumps(conflicts_list), json.dumps(missing_evidence_list),
                    json.dumps(source_health_summary), now_iso,
                    incident_id
                ))
            else:
                cursor.execute("""
                INSERT INTO incidents (
                    incident_id, title, fictional_zone, priority, status,
                    correlation_confidence, recommendation, heuristic_score,
                    score_components, conflicting_evidence, missing_evidence,
                    source_health_summary, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    incident_id, title, zone, priority,
                    correlation_confidence, recommendation, heuristic_score,
                    json.dumps(score_breakdown), json.dumps(conflicts_list), json.dumps(missing_evidence_list),
                    json.dumps(source_health_summary), now_iso, now_iso
                ))
                incidents_created_count += 1

            # Link incident and reports in incident_reports table
            cursor.execute("DELETE FROM incident_reports WHERE incident_id = ?;", (incident_id,))
            for rep in cluster:
                is_dup = 1 if rep["report_id"] in duplicates_set else 0
                match_strength = 0.5 if is_dup else (0.9 if rep["confidence_score"] > 0.7 else 0.7)
                rule_name = "EXACT_DUPLICATE_FILTER" if is_dup else ("MULTI_SOURCE_SPATIAL_TEMPORAL" if unique_sources_count >= 2 else "SPATIAL_CLUSTER_SINGLE_SOURCE")
                cursor.execute("""
                INSERT INTO incident_reports (incident_id, report_id, correlation_rule, match_strength, is_duplicate, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?);
                """, (
                    incident_id, rep["report_id"], rule_name, match_strength, is_dup,
                    "Duplicate suppressed from corroboration" if is_dup else "Corroborating observation",
                    now_iso
                ))

            # Update report status to CORRELATED
            for rep in cluster:
                cursor.execute("UPDATE reports SET status = 'CORRELATED' WHERE report_id = ?;", (rep["report_id"],))

    logger.info(f"Correlation cycle completed: {incidents_created_count} candidate incidents generated/updated.")
    return {
        "status": "COMPLETED",
        "incidents_created": incidents_created_count,
        "reports_analyzed": len(all_reports),
        "execution_timestamp": now_iso,
    }
