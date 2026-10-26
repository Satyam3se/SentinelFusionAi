"""
SentinelFusion AI - Configuration and Security Settings
"""
import os
from pathlib import Path
from typing import List

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "sentinelfusion.db"

# Security & Secrets (Defaults for local prototype dev; production should set env vars)
SECRET_KEY = os.getenv("SENTINEL_SECRET_KEY", "sentinel-prototype-secret-key-defence-ai-2026-eval-auth")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

# Rate Limiting configuration
RATE_LIMIT_MAX_ATTEMPTS = int(os.getenv("RATE_LIMIT_MAX_ATTEMPTS", "5"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "300"))  # 5 minutes lockout

# CORS Configuration
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Synthetic Data & Defence Prototype Banners
DISCLAIMER_BANNER = (
    "SENTINELFUSION AI SYNTHETIC DEMONSTRATION PROTOTYPE — "
    "FOR EVALUATION PURPOSES ONLY. CONTAINS STRICTLY SYNTHETIC DATA AND FICTIONAL ZONES. "
    "NOT AN OFFICIAL INDIAN ARMY / MoD / DRDO SYSTEM. NOT CONNECTED TO OPERATIONAL SENSORS."
)

# Standard Demonstration Fictional Zones
FICTIONAL_ZONES = [
    {"id": "DEMO-ZONE-A", "name": "Northern Valley Sector (Fictional)", "terrain": "Mountainous Gorge", "risk_level": "High"},
    {"id": "DEMO-ZONE-B", "name": "Western Arid Ridge (Fictional)", "terrain": "Desert Plains", "risk_level": "Medium"},
    {"id": "DEMO-ZONE-C", "name": "Highland Basin Corridor (Fictional)", "terrain": "Plateau Scrubland", "risk_level": "Low"},
    {"id": "DEMO-ZONE-D", "name": "Eastern Riverine Outpost (Fictional)", "terrain": "Wetland Basin", "risk_level": "Elevated"},
]

# Configured Synthetic Demonstration Sources
DEMO_SOURCES = [
    {"source_id": "RADAR-SYNTH-01", "name": "Synthetic Air/Ground Radar Unit Alpha", "source_type": "RADAR", "zone": "DEMO-ZONE-A", "staleness_threshold_sec": 300},
    {"source_id": "RADAR-SYNTH-02", "name": "Synthetic Perimeter Radar Unit Beta", "source_type": "RADAR", "zone": "DEMO-ZONE-B", "staleness_threshold_sec": 300},
    {"source_id": "OPTICAL-CAM-03", "name": "Synthetic Long-Range Electro-Optical Cam", "source_type": "OPTICAL_CAM", "zone": "DEMO-ZONE-A", "staleness_threshold_sec": 600},
    {"source_id": "OPTICAL-CAM-04", "name": "Synthetic Thermal Border Mast 4", "source_type": "OPTICAL_CAM", "zone": "DEMO-ZONE-C", "staleness_threshold_sec": 600},
    {"source_id": "UAV-RECON-02", "name": "Synthetic UAV Micro-Recon Feed 02", "source_type": "UAV_RECON", "zone": "DEMO-ZONE-A", "staleness_threshold_sec": 180},
    {"source_id": "SIGINT-BEACON-05", "name": "Synthetic Direction-Finding Beacon 05", "source_type": "SIGINT_BEACON", "zone": "DEMO-ZONE-B", "staleness_threshold_sec": 900},
    {"source_id": "OBSERVER-MANUAL-01", "name": "Synthetic Forward Observer Field Report", "source_type": "MANUAL_REPORT", "zone": "DEMO-ZONE-C", "staleness_threshold_sec": 1800},
]

# Role-Based Access Control Roles
ROLES = {
    "ADMINISTRATOR": "Administrator",
    "ANALYST": "Analyst",
    "REVIEWER": "Reviewer",
    "OBSERVER": "Read-only Observer",
}

# Role permissions
ROLE_PERMISSIONS = {
    "Administrator": ["manage_users", "view_audit", "system_config", "import_reports", "run_analysis", "review_incidents", "view_reports", "view_incidents"],
    "Analyst": ["import_reports", "run_analysis", "create_incidents", "view_reports", "view_incidents", "view_audit"],
    "Reviewer": ["review_incidents", "request_verification", "view_reports", "view_incidents", "view_audit"],
    "Read-only Observer": ["view_reports", "view_incidents"],
}
