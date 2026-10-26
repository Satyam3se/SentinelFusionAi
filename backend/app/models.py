"""
SentinelFusion AI - Pydantic Request & Response Data Models
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# User & Auth Models
class UserLogin(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., min_length=6, description="Password")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    full_name: str
    expires_in_minutes: int

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Email address")
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., description="Administrator, Analyst, Reviewer, or Read-only Observer")

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None
    failed_login_attempts: int = 0

# Report Models
class ReportCreate(BaseModel):
    report_id: Optional[str] = None
    source_id: str
    source_type: str
    fictional_zone: str
    event_type: str
    description: str
    raw_payload: Optional[str] = "{}"
    confidence_score: float = Field(0.7, ge=0.0, le=1.0)
    report_timestamp: str
    is_synthetic: bool = True

class ReportResponse(BaseModel):
    id: int
    report_id: str
    source_id: str
    source_type: str
    fictional_zone: str
    event_type: str
    description: str
    raw_payload: Optional[str] = "{}"
    confidence_score: float
    status: str
    data_quality_status: str
    missing_fields: List[str]
    is_synthetic: bool
    report_timestamp: str
    received_timestamp: str
    created_at: str

class CSVImportRowError(BaseModel):
    row_number: int
    raw_data: str
    error: str

class ReportImportResult(BaseModel):
    total_processed: int
    imported_count: int
    rejected_count: int
    rejected_errors: List[CSVImportRowError]

# Incident Models
class HeuristicScoreBreakdown(BaseModel):
    zone_risk_score: float
    multi_source_corroboration_score: float
    temporal_clustering_score: float
    confidence_weight_score: float
    conflict_penalty: float
    staleness_penalty: float
    total_score: float
    formula_explanation: str

class IncidentReportLink(BaseModel):
    report_id: str
    source_id: str
    source_type: str
    fictional_zone: str
    event_type: str
    description: str
    confidence_score: float
    report_timestamp: str
    correlation_rule: str
    match_strength: float
    is_duplicate: bool
    data_quality_status: str

class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    title: str
    fictional_zone: str
    priority: str
    status: str
    correlation_confidence: str
    recommendation: str
    heuristic_score: float
    score_components: Dict[str, Any]
    conflicting_evidence: List[Dict[str, Any]]
    missing_evidence: List[str]
    source_health_summary: Dict[str, Any]
    assigned_reviewer_id: Optional[int] = None
    reviewer_username: Optional[str] = None
    reviewer_notes: Optional[str] = None
    correction_reason: Optional[str] = None
    created_at: str
    updated_at: str
    reviewed_at: Optional[str] = None
    related_reports: Optional[List[IncidentReportLink]] = None

# Review Decision Models
class ReviewDecisionCreate(BaseModel):
    action: str = Field(..., description="ACCEPT_RECOMMENDATION, CORRECT_PRIORITY, CORRECT_CLASSIFICATION, REQUEST_VERIFICATION, MARK_REVIEWED, CLOSE_INCIDENT")
    resulting_priority: Optional[str] = None
    resulting_status: Optional[str] = None
    correction_reason: Optional[str] = Field(None, description="Mandatory when correcting priority or classification")
    reviewer_notes: Optional[str] = None

class VerificationRequestCreate(BaseModel):
    target_source_type: str
    fictional_zone: str
    specific_questions: str = Field(..., min_length=10)
    priority: str = "HIGH"

# Source Health Models
class SourceHealthResponse(BaseModel):
    source_id: str
    name: str
    source_type: str
    fictional_zone: str
    status: str
    staleness_threshold_sec: int
    last_heartbeat_at: Optional[str] = None
    last_report_at: Optional[str] = None
    total_reports_count: int
    error_count: int
    notes: Optional[str] = None
    is_stale: bool = False

# Audit Log Models
class AuditEventResponse(BaseModel):
    id: int
    timestamp: str
    actor_id: Optional[int]
    actor_username: str
    actor_role: str
    action: str
    target_type: str
    target_id: str
    previous_state: Optional[str]
    resulting_state: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]

# Dashboard Metrics
class DashboardMetrics(BaseModel):
    total_incoming_reports: int
    candidate_incident_groups: int
    reports_awaiting_verification: int
    data_quality_warnings: int
    stale_or_unavailable_sources: int
    human_reviewed_incidents: int
    system_health_status: str
    incident_status_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    source_distribution: Dict[str, int]
    last_successful_processing_time: str
    is_synthetic_environment: bool = True

# Situation Report Models
class SituationReportRequest(BaseModel):
    title: str = "OPERATIONAL SITUATION SUMMARY (SYNTHETIC)"
    fictional_zone: Optional[str] = None
    incident_ids: Optional[List[str]] = None
    include_contradictions: bool = True
    include_audit_trail: bool = True

# Simulation Lab Models
class ScenarioInfo(BaseModel):
    id: str
    title: str
    description: str
    expected_outcome: str
    failure_type: str

class SimulationRunResult(BaseModel):
    scenario_id: str
    scenario_title: str
    reports_generated_count: int
    incidents_formed_count: int
    conflicts_detected_count: int
    duplicates_filtered_count: int
    insufficient_evidence_count: int
    details: List[str]
    expected_behavior_matched: bool
