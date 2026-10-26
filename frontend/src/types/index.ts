// TypeScript Interfaces for SentinelFusion AI

export type UserRole = 'Administrator' | 'Analyst' | 'Reviewer' | 'Read-only Observer';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface ReportCreate {
  source_id: string;
  source_type: string;
  fictional_zone: string;
  event_type: string;
  description: string;
  raw_payload?: string;
  confidence_score: number;
  report_timestamp: string;
  is_synthetic?: boolean;
}

export interface Report {
  id: number;
  report_id: string;
  source_id: string;
  source_type: 'RADAR' | 'OPTICAL_CAM' | 'UAV_RECON' | 'SIGINT_BEACON' | 'MANUAL_REPORT' | string;
  fictional_zone: string;
  event_type: string;
  description: string;
  raw_payload?: string;
  confidence_score: number;
  status: 'INGESTED' | 'CORRELATED' | 'DISMISSED' | 'FLAGGED';
  data_quality_status: 'VALID' | 'STALE_SOURCE' | 'MISSING_FIELDS' | 'DUPLICATE' | string;
  missing_fields: string[];
  is_synthetic: boolean;
  report_timestamp: string;
  received_timestamp: string;
  created_at: string;
}

export interface IncidentReportLink {
  report_id: string;
  source_id: string;
  source_type: string;
  fictional_zone: string;
  event_type: string;
  description: string;
  confidence_score: number;
  report_timestamp: string;
  correlation_rule: string;
  match_strength: number;
  is_duplicate: boolean;
  data_quality_status: string;
}

export interface Incident {
  id: number;
  incident_id: string;
  title: string;
  fictional_zone: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCONFIRMED';
  status: 'NEW' | 'PENDING_REVIEW' | 'VERIFICATION_REQUESTED' | 'REVIEWED_CONFIRMED' | 'REVIEWED_CORRECTED' | 'CLOSED';
  correlation_confidence: 'CONFIRMED_DATA_MATCH' | 'POSSIBLE_RELATIONSHIP' | 'CONTRADICTORY_EVIDENCE' | 'INSUFFICIENT_EVIDENCE' | 'DUPLICATE_RECORD';
  recommendation: 'PROCEED_VERIFICATION' | 'ROUTINE_MONITORING' | 'INSUFFICIENT_EVIDENCE' | 'CORRELATION_CONFLICT' | 'DISMISS_DUPLICATE';
  heuristic_score: number;
  score_components: {
    zone_risk_score?: number;
    corroboration_score?: number;
    unique_sources_count?: number;
    confidence_weight?: number;
    density_weight?: number;
    conflict_penalty?: number;
    staleness_penalty?: number;
    missing_fields_penalty?: number;
    formula?: string;
    notice?: string;
  };
  conflicting_evidence: Array<{
    report_a: string;
    source_a: string;
    report_b: string;
    source_b: string;
    explanation: string;
  }>;
  missing_evidence: string[];
  source_health_summary: {
    total_reports?: number;
    unique_sources?: number;
    duplicates_detected?: number;
    has_stale_source?: boolean;
    has_missing_fields?: boolean;
  };
  assigned_reviewer_id?: number | null;
  reviewer_username?: string | null;
  reviewer_notes?: string | null;
  correction_reason?: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at?: string | null;
  related_reports?: IncidentReportLink[];
}

export interface SourceHealth {
  source_id: string;
  name: string;
  source_type: string;
  fictional_zone: string;
  status: 'ONLINE' | 'STALE' | 'UNAVAILABLE' | 'MAINTENANCE';
  staleness_threshold_sec: number;
  last_heartbeat_at?: string | null;
  last_report_at?: string | null;
  total_reports_count: number;
  error_count: number;
  notes?: string | null;
  is_stale: boolean;
}

export interface AuditEvent {
  id: number;
  timestamp: string;
  actor_id?: number | null;
  actor_username: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  previous_state?: string | null;
  resulting_state?: string | null;
  details?: string | null;
  ip_address?: string | null;
}

export interface DashboardMetrics {
  total_incoming_reports: number;
  candidate_incident_groups: number;
  reports_awaiting_verification: number;
  data_quality_warnings: number;
  stale_or_unavailable_sources: number;
  human_reviewed_incidents: number;
  system_health_status: 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL';
  incident_status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  last_successful_processing_time: string;
  is_synthetic_environment: boolean;
}

export interface ScenarioInfo {
  id: string;
  title: string;
  description: string;
  expected_outcome: string;
  failure_type: string;
}

export interface SecurityPosture {
  session_information: {
    authenticated_user: string;
    full_name: string;
    assigned_role: string;
    effective_permissions: string[];
    session_ttl_minutes: number;
  };
  defensive_security_controls: Array<{
    control: string;
    implementation: string;
    status: string;
  }>;
  telemetry_metrics: {
    total_failed_logins_recorded: number;
    currently_locked_accounts: number;
    recent_security_events_count: number;
  };
  recent_security_events: AuditEvent[];
  disclaimer_notice: string;
  honest_limitations: string[];
}
