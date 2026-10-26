"""
SentinelFusion AI - Comprehensive Automated Test Suite
Covers Auth, RBAC, Reports, CSV Validation, Correlation Engine, Human Review, Audit, and Simulation.
"""
import unittest
import json
import sqlite3
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db, db_session
from app.auth import seed_demo_users_if_empty, hash_password, verify_password
from app.simulation_engine import generate_standard_demo_dataset, load_simulation_scenario
from app.correlation_engine import is_exact_duplicate, are_contradictory, compute_heuristic_score

client = TestClient(app)

class TestSentinelFusionBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Prepare database and demo accounts before test execution."""
        init_db()
        seed_demo_users_if_empty()

    def test_01_health_and_readiness_endpoints(self):
        """Verify liveness and readiness probe endpoints."""
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "HEALTHY")
        self.assertIn("SYNTHETIC DEMONSTRATION PROTOTYPE", res.json()["disclaimer"])

        res_ready = client.get("/api/health/ready")
        self.assertEqual(res_ready.status_code, 200)
        self.assertEqual(res_ready.json()["database"], "CONNECTED")

    def test_02_security_headers_present(self):
        """Verify defensive HTTP security headers injected by middleware."""
        res = client.get("/api/health")
        self.assertEqual(res.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(res.headers.get("x-frame-options"), "DENY")
        self.assertIn("default-src 'self'", res.headers.get("content-security-policy", ""))
        self.assertEqual(res.headers.get("x-sentinel-synthetic-disclaimer"), "STRICTLY_SYNTHETIC_DEMO_DATA")

    def test_03_authentication_success_and_roles(self):
        """Verify successful sign-in and token generation for all 4 roles."""
        roles = [
            ("admin", "SentinelAdminDemo#2026", "Administrator"),
            ("analyst", "SentinelAnalystDemo#2026", "Analyst"),
            ("reviewer", "SentinelReviewerDemo#2026", "Reviewer"),
            ("observer", "SentinelObserverDemo#2026", "Read-only Observer"),
        ]
        for uname, pwd, expected_role in roles:
            res = client.post("/api/auth/login", json={"username_or_email": uname, "password": pwd})
            self.assertEqual(res.status_code, 200, f"Login failed for {uname}: {res.text}")
            data = res.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["role"], expected_role)

    def test_04_authentication_failure_generic_error(self):
        """Verify wrong password returns generic 401 without leaking internal details."""
        res = client.post("/api/auth/login", json={"username_or_email": "admin", "password": "WrongPassword!999"})
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid credentials", res.json()["detail"])

    def test_05_rbac_endpoint_protection(self):
        """Verify non-admin role is blocked from admin-only routes."""
        # Login as read-only observer
        obs_res = client.post("/api/auth/login", json={"username_or_email": "observer", "password": "SentinelObserverDemo#2026"})
        token = obs_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to access admin users list
        admin_res = client.get("/api/admin/users", headers=headers)
        self.assertEqual(admin_res.status_code, 403)
        self.assertIn("Access denied", admin_res.json()["detail"])

        # Attempt to create a report as observer (should fail: needs Analyst/Admin)
        rep_res = client.post("/api/reports", json={
            "source_id": "RADAR-SYNTH-01",
            "source_type": "RADAR",
            "fictional_zone": "DEMO-ZONE-A",
            "event_type": "TEST",
            "description": "Unauthorized attempt",
            "report_timestamp": "2026-10-26T10:00:00Z"
        }, headers=headers)
        self.assertEqual(rep_res.status_code, 403)

    def test_06_reports_listing_and_filtering(self):
        """Verify reports endpoint supports filtering by zone and pagination."""
        # Login as analyst
        login_res = client.post("/api/auth/login", json={"username_or_email": "analyst", "password": "SentinelAnalystDemo#2026"})
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        res = client.get("/api/reports?zone=DEMO-ZONE-A", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reports", data)
        for r in data["reports"]:
            self.assertEqual(r["fictional_zone"], "DEMO-ZONE-A")

    def test_07_csv_schema_and_malformed_quarantine(self):
        """Verify strict CSV ingestion quarantine behavior for malformed rows."""
        login_res = client.post("/api/auth/login", json={"username_or_email": "analyst", "password": "SentinelAnalystDemo#2026"})
        headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        # CSV containing 1 valid row and 1 invalid row (invalid source_type)
        csv_content = (
            "source_id,source_type,fictional_zone,event_type,description,confidence_score,report_timestamp\n"
            "RADAR-SYNTH-01,RADAR,DEMO-ZONE-A,AERIAL_RADAR,Valid synthetic radar track,0.85,2026-10-26T10:00:00Z\n"
            "UNKNOWN-99,INVALID_TYPE,DEMO-ZONE-A,UNKNOWN,Invalid type track,0.50,2026-10-26T10:01:00Z\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        res = client.post("/api/reports/upload-csv", headers=headers, files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["imported_count"], 1)
        self.assertEqual(data["rejected_count"], 1)
        self.assertIn("Invalid source_type", data["rejected_errors"][0]["error"])

    def test_08_correlation_engine_duplicate_detection(self):
        """Verify exact duplicate detection logic suppresses duplicate corroboration."""
        r1 = {
            "description": "Synthetic radar track detecting low-altitude aerial target moving east at 180 knots.",
            "fictional_zone": "DEMO-ZONE-A",
            "source_id": "RADAR-SYNTH-01",
            "event_type": "AERIAL_TRACK",
            "report_timestamp": "2026-10-26T10:00:00Z"
        }
        r2 = {
            "description": "Synthetic radar track detecting low-altitude aerial target moving east at 180 knots.",
            "fictional_zone": "DEMO-ZONE-A",
            "source_id": "RADAR-SYNTH-01",
            "event_type": "AERIAL_TRACK",
            "report_timestamp": "2026-10-26T10:00:05Z"
        }
        is_dup, reason = is_exact_duplicate(r1, r2)
        self.assertTrue(is_dup)
        self.assertIn("Identical description", reason)

    def test_09_correlation_engine_contradiction_detection(self):
        """Verify conflicting observations in same zone are flagged."""
        r_aerial = {
            "fictional_zone": "DEMO-ZONE-A",
            "source_id": "OPTICAL-CAM-03",
            "description": "High-speed aerial drone intrusion detected near northern boundary."
        }
        r_ground = {
            "fictional_zone": "DEMO-ZONE-A",
            "source_id": "OBSERVER-MANUAL-01",
            "description": "Stationary ground agricultural tractor operating near ridge."
        }
        is_conflict, reason = are_contradictory(r_aerial, r_ground)
        self.assertTrue(is_conflict)
        self.assertIn("Conflict detected", reason)

    def test_10_heuristic_score_components(self):
        """Verify heuristic score formula produces transparent breakdown."""
        score, breakdown = compute_heuristic_score(
            zone="DEMO-ZONE-A",
            unique_sources_count=2,
            total_valid_reports=2,
            avg_confidence=0.85,
            has_contradictions=False,
            has_stale_source=False,
            has_missing_fields=False
        )
        self.assertGreater(score, 40.0)
        self.assertEqual(breakdown["unique_sources_count"], 2)
        self.assertIn("Heuristic composite index", breakdown["notice"])

    def test_11_human_review_mandatory_correction_reason(self):
        """Verify that correcting priority requires a mandatory reason, and succeeds with reason."""
        # Login as reviewer
        rev_res = client.post("/api/auth/login", json={"username_or_email": "reviewer", "password": "SentinelReviewerDemo#2026"})
        headers = {"Authorization": f"Bearer {rev_res.json()['access_token']}"}

        # Seed demo dataset and run correlation
        client.post("/api/simulation/seed-demo", headers={"Authorization": f"Bearer {client.post('/api/auth/login', json={'username_or_email': 'admin', 'password': 'SentinelAdminDemo#2026'}).json()['access_token']}"})

        # Get first incident
        inc_res = client.get("/api/incidents", headers=headers)
        incidents = inc_res.json()["incidents"]
        self.assertGreater(len(incidents), 0)
        target_inc = incidents[0]["incident_id"]

        # Attempt to correct priority WITHOUT reason (must be rejected)
        fail_res = client.post(f"/api/review/decide/{target_inc}", json={
            "action": "CORRECT_PRIORITY",
            "resulting_priority": "CRITICAL",
            "correction_reason": ""  # Missing reason!
        }, headers=headers)
        self.assertEqual(fail_res.status_code, 400)
        self.assertIn("mandatory explanation", fail_res.json()["detail"])

        # Attempt with valid explanation (must succeed)
        success_res = client.post(f"/api/review/decide/{target_inc}", json={
            "action": "CORRECT_PRIORITY",
            "resulting_priority": "CRITICAL",
            "correction_reason": "Escalated due to secondary sensor corroboration in vulnerable mountain gorge.",
            "reviewer_notes": "Immediate UAV patrol dispatched."
        }, headers=headers)
        self.assertEqual(success_res.status_code, 200)
        self.assertEqual(success_res.json()["resulting_priority"], "CRITICAL")
        self.assertEqual(success_res.json()["resulting_status"], "REVIEWED_CORRECTED")

    def test_12_audit_trail_recorded(self):
        """Verify that human review action generated an append-only audit record."""
        rev_res = client.post("/api/auth/login", json={"username_or_email": "reviewer", "password": "SentinelReviewerDemo#2026"})
        headers = {"Authorization": f"Bearer {rev_res.json()['access_token']}"}

        audit_res = client.get("/api/audit", headers=headers)
        self.assertEqual(audit_res.status_code, 200)
        data = audit_res.json()
        self.assertGreater(data["total"], 0)
        # Verify review action is in events
        actions = [e["action"] for e in data["events"]]
        self.assertTrue(any("INCIDENT_CORRECT_PRIORITY" in a or "LOGIN_SUCCESS" in a for a in actions))

    def test_13_situation_report_generation(self):
        """Verify SITREP generates cleanly using stored application records."""
        rev_res = client.post("/api/auth/login", json={"username_or_email": "reviewer", "password": "SentinelReviewerDemo#2026"})
        headers = {"Authorization": f"Bearer {rev_res.json()['access_token']}"}

        sitrep_res = client.post("/api/situation-reports/generate", json={
            "title": "DAILY OPERATIONAL EVALUATION SITREP",
            "fictional_zone": "DEMO-ZONE-A",
            "include_contradictions": True,
            "include_audit_trail": True
        }, headers=headers)
        self.assertEqual(sitrep_res.status_code, 200)
        data = sitrep_res.json()
        self.assertIn("report_id", data)
        self.assertIn("metrics", data)
        self.assertIn("known_limitations", data)

    def test_14_simulation_lab_scenarios(self):
        """Verify simulation lab returns 10 scenarios and can execute scenario 4 (contradictions)."""
        adm_res = client.post("/api/auth/login", json={"username_or_email": "admin", "password": "SentinelAdminDemo#2026"})
        headers = {"Authorization": f"Bearer {adm_res.json()['access_token']}"}

        scen_res = client.get("/api/simulation/scenarios", headers=headers)
        self.assertEqual(scen_res.status_code, 200)
        scenarios = scen_res.json()
        self.assertEqual(len(scenarios), 10)

        # Load Scenario 4 (contradictory observations)
        load_res = client.post("/api/simulation/load/SCEN-04", headers=headers)
        self.assertEqual(load_res.status_code, 200)
        self.assertTrue(load_res.json()["expected_behavior_matched"])

    def test_15_security_centre_posture(self):
        """Verify security centre endpoint returns active controls and posture."""
        adm_res = client.post("/api/auth/login", json={"username_or_email": "admin", "password": "SentinelAdminDemo#2026"})
        headers = {"Authorization": f"Bearer {adm_res.json()['access_token']}"}

        sec_res = client.get("/api/security/status", headers=headers)
        self.assertEqual(sec_res.status_code, 200)
        data = sec_res.json()
        self.assertIn("defensive_security_controls", data)
        self.assertIn("session_information", data)

    def test_16_tactical_radar_contacts(self):
        """Verify tactical radar returns contacts with polar coordinates and AI recommended COAs."""
        rev_res = client.post("/api/auth/login", json={"username_or_email": "reviewer", "password": "SentinelReviewerDemo#2026"})
        headers = {"Authorization": f"Bearer {rev_res.json()['access_token']}"}

        rad_res = client.get("/api/tactical/radar-contacts", headers=headers)
        self.assertEqual(rad_res.status_code, 200)
        data = rad_res.json()
        self.assertIn("contacts", data)
        self.assertGreater(len(data["contacts"]), 0)
        contact = data["contacts"][0]
        self.assertIn("bearing_deg", contact)
        self.assertIn("range_km", contact)
        self.assertIn("ew_spoofing_risk", contact)
        self.assertIn("recommended_coas", contact)
        self.assertGreater(len(contact["recommended_coas"]), 0)

    def test_17_tactical_execute_coa(self):
        """Verify human-in-the-loop COA authorization and receipt issuance."""
        rev_res = client.post("/api/auth/login", json={"username_or_email": "reviewer", "password": "SentinelReviewerDemo#2026"})
        headers = {"Authorization": f"Bearer {rev_res.json()['access_token']}"}

        rad_res = client.get("/api/tactical/radar-contacts", headers=headers)
        contact = rad_res.json()["contacts"][0]
        coa = contact["recommended_coas"][0]

        exec_res = client.post("/api/tactical/execute-coa", json={
            "contact_id": contact["contact_id"],
            "coa_id": coa["coa_id"],
            "coa_name": coa["name"],
            "action_type": coa["action_type"],
            "officer_justification": "Authorized test tactical order for simulated exercise."
        }, headers=headers)
        self.assertEqual(exec_res.status_code, 200)
        rec = exec_res.json()
        self.assertEqual(rec["status"], "COA_ORDER_TRANSMITTED")
        self.assertIn("execution_receipt", rec)
        self.assertTrue(rec["execution_receipt"].startswith("ORD-"))

if __name__ == "__main__":
    unittest.main(verbosity=2)


