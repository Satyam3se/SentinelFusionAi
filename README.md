# SENTINELFUSION AI
## Defence Situational Awareness, Multi-Sensor Correlation & Tactical Decision Support Platform
### 🇮🇳 Dark Tricolour Edition (Indian National Flag Theme)

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Dark Tricolour](https://img.shields.io/badge/Theme-Dark%20Tricolour-FF9933.svg?logoColor=white)](https://github.com/Satyam3se/SentinelFusionAi)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-138808.svg?logo=cloudflare&logoColor=white)](https://adware-mostly-windsor-comics.trycloudflare.com)

> **🚀 LIVE PROTOTYPE ACCESS**:
> - **Public URL**: [https://adware-mostly-windsor-comics.trycloudflare.com](https://adware-mostly-windsor-comics.trycloudflare.com)
> - **Review Officer Account**: `reviewer` / `SentinelReviewerDemo#2026`
> - **Intelligence Analyst Account**: `analyst` / `SentinelAnalystDemo#2026`
> - **Administrator Account**: `admin` / `SentinelAdminDemo#2026`

---

> **IMPORTANT SCOPE & DISCLAIMER**:
> SentinelFusion AI is an **independent prototype** designed for hackathon demonstration and academic/defence-software systems evaluation. It is **NOT** an official Indian Army, Ministry of Defence (MoD), or DRDO system. All operational sectors (`DEMO-ZONE-A`, `DEMO-ZONE-B`, etc.) and telemetry records (`REP-001`, `REP-002`, etc.) are **strictly synthetic demonstration data**. The platform does not connect to live operational sensors, classified networks, or weapons systems, and prioritizes human-reviewed situational awareness and data integrity rather than autonomous engagement decisions.

---

## 1. Executive Summary & Vision

Traditional defence intelligence displays often overwhelm operators with false alarms or present every correlation recommendation as fact. **SentinelFusion AI** implements **Failure-Aware Decision Support & Active Tactical Command (C2)**:
1. **360° Active Phased-Array Radar Scope**: Real-time 50km sweeping radar beam, polar coordinates tracking (bearing/range/altitude/velocity), and interactive target tracking across fictional operational sectors.
2. **Electronic Warfare (EW) Spoofing Anomaly Detection**: Surfaces RF/acoustic sensor contradictions, flagging high EW spoofing risk (74%) and downgrading sensor trust index to prevent false alarms.
3. **AI Courses of Action (COA) Matrix**: Synthesizes and ranks 3 tactical response alternatives per contact (Reconnaissance, Intercept, Counter-EW Jamming) with readiness time and risk profiles.
4. **100% Human-in-the-Loop Military Accountability**: Strictly enforces officer sign-off with mandatory tactical justifications before issuing cryptographic military order receipts (`ORD-YYYYMMDD...`).
5. **Explicit Uncertainty & Contradiction Surfacing**: Distinguishes between verified multi-sensor corroboration, possible relationships, direct contradictions, and insufficient evidence.
6. **Append-Only Immutable Audit Trail**: All sign-ins, imports, correlation cycles, review corrections, tactical orders, and exports are cryptographically preserved in SQLite WAL storage.
7. **Offline-First Standalone Edge Resilience**: Zero external cloud API dependency. Built-in offline queue automatically reconciles changes when reconnected.


---

## 2. Technology Stack & Architecture

- **Frontend**:
  - React 19, TypeScript, Vite 8
  - Tailwind CSS v4 with bespoke Indian defence aesthetic (Deep forest green, tactical olive, charcoal, sand/khaki surfaces, and restrained Indian tricolour saffron/white/green accents)
  - React Router v6 with protected routes and server-backed session validation
  - Lucide React tactical icons
  - Offline local outbox queue in `localStorage` for network resilience
- **Backend**:
  - Python 3.14+ FastAPI
  - SQLite with Write-Ahead Logging (WAL) and foreign key constraints enabled
  - Cryptography: PBKDF2-HMAC-SHA256 with 600,000 iterations and unique 32-byte salts per user
  - PyJWT Bearer token session authentication
  - Server-enforced Role-Based Access Control (`Administrator`, `Analyst`, `Reviewer`, `Read-only Observer`)
  - Server-side rate limiting on authentication endpoints
  - Defensive security headers (CSP, nosniff, DENY, XSS-Protection)
  - Pydantic v2 schemas for data validation and strict CSV quarantine
- **Deterministic Rules & Simulation Engine**:
  - Spatial-temporal clustering
  - Heuristic scoring index (transparent component breakdown: base risk + corroboration + confidence weight + density - conflict penalty - staleness penalty)
  - 10 reproducible failure-handling test scenarios

---

## 3. Directory Structure

```text
sentinelfusion-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entry point, security headers, lifespan hooks
│   │   ├── config.py                # Fictional zones, synthetic sources, RBAC permissions
│   │   ├── database.py              # SQLite connection manager, WAL mode, tables initialization
│   │   ├── models.py                # Pydantic request/response data contracts
│   │   ├── auth.py                  # PBKDF2 password hashing, JWT tokens, rate limiting, RBAC
│   │   ├── audit.py                 # Append-only audit logging helper
│   │   ├── correlation_engine.py    # Deterministic rules engine (dedup, corroboration, conflicts)
│   │   ├── simulation_engine.py     # 10 reproducible failure scenarios & 14-report demo generator
│   │   └── routes/
│   │       ├── auth_routes.py       # /api/auth (login, logout, session restoration)
│   │       ├── report_routes.py     # /api/reports (search, filter, pagination, strict CSV import)
│   │       ├── incident_routes.py   # /api/incidents (candidate clusters, detachment, timeline)
│   │       ├── review_routes.py     # /api/review (review queue, mandatory justifications)
│   │       ├── source_health_routes.py # /api/source-health (telemetry, staleness, heartbeats)
│   │       ├── situation_report_routes.py # /api/situation-reports (SITREP generator & CSV export)
│   │       ├── simulation_routes.py # /api/simulation (10 scenarios, dataset reload, reset)
│   │       ├── audit_routes.py      # /api/audit (append-only log viewer)
│   │       ├── security_routes.py   # /api/security (defensive controls posture)
│   │       └── admin_routes.py      # /api/admin (user management & dashboard metrics)
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_all.py              # Automated test suite (15 end-to-end tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Sidebar, Layout, SyntheticBanner, StatusBadge, MetricCard, Modal
│   │   ├── context/                 # AuthContext (JWT session, role checks, reachability probe)
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx           # Page 1: Public landing with tricolour accents & problem statement
│   │   │   ├── LoginPage.tsx             # Page 2: Secure sign-in with quick-fill demo buttons & rate limit alerts
│   │   │   ├── DashboardPage.tsx         # Page 3: Main tactical dashboard with dynamic calculated metrics
│   │   │   ├── ReportsPage.tsx           # Page 4: Incoming telemetry, filters, and safe CSV import
│   │   │   ├── IncidentsPage.tsx         # Page 5: 5-state evidence taxonomy & correlation clusters
│   │   │   ├── IncidentDetailPage.tsx    # Page 6: Chronological timeline & heuristic score breakdown
│   │   │   ├── AnalysisPage.tsx          # Page 7: Transparent rules engine & heuristic formula breakdown
│   │   │   ├── ReviewCentrePage.tsx      # Page 8: Human review queue & mandatory justification enforcement
│   │   │   ├── SourceHealthPage.tsx      # Page 9: Sensor heartbeats & silence-is-not-tranquility telemetry
│   │   │   ├── OfflineResiliencePage.tsx # Page 10: Local standalone mode, SQLite verification, outbox queue
│   │   │   ├── SituationReportsPage.tsx  # Page 11: Audit-traceable SITREP generator & CSV export
│   │   │   ├── SimulationLabPage.tsx     # Page 12: 10 reproducible failure scenarios test bench
│   │   │   ├── AuditTrailPage.tsx        # Page 13: Append-only immutable audit viewer
│   │   │   ├── SecurityCentrePage.tsx    # Page 14: Defensive cybersecurity posture inspection
│   │   │   ├── UserAdminPage.tsx         # Page 15: Server-enforced RBAC user provisioning (Admin only)
│   │   │   └── DocumentationPage.tsx     # Page 16: Architecture specifications & institutional roadmap
│   │   ├── services/api.ts          # Centralized API client with JWT & offline queue
│   │   ├── types/index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                  # React Router v6 setup with 16 distinct pages
│   │   ├── index.css                # Tactical dark operational theme & Indian defence palette
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .gitignore
└── README.md
```

---

## 4. The 16 Multi-Page Application Routes

| Route | Page Name | Primary Operational Function |
|---|---|---|
| `/` | **Public Landing Page** | Defence-inspired overview, problem statement, failure-aware principles, non-affiliation disclaimer. |
| `/login` | **Secure Sign-In** | Rate-limited authentication, password show/hide, generic failure messages, demo account quick-fill. |
| `/dashboard` | **Main Intelligence Dashboard** | Dynamically calculated metrics, priority distribution, active incident clusters, quick correlation triggers. |
| `/reports` | **Incoming Reports** | Paginated telemetry table, source freshness tags, inspection modals, strict CSV upload with row quarantine. |
| `/incidents` | **Incident Correlation** | Spatial-temporal clusters, 5-state evidence taxonomy, duplicate suppression, report separation modal. |
| `/incidents/:id` | **Incident Detail & Timeline** | Chronological event timeline, heuristic score breakdown, contradiction warnings, review history. |
| `/analysis` | **Explainable Rules Engine** | Transparent rules documentation, heuristic score formula, explicit "Insufficient Evidence" outcome. |
| `/review` | **Human Review Centre** | FIFO pending review queue, Accept/Correct/Verify actions, mandatory recorded justification check. |
| `/source-health` | **Source Health & Data Quality** | Telemetry freshness, heartbeat simulation, "silence is not tranquility" alert banner. |
| `/resilience` | **Offline Resilience Centre** | Standalone SQLite verification, backend reachability probe, local mutation outbox queue. |
| `/situation-reports`| **Situation Report Generator** | Traceable SITREP document assembly from stored records, CSV export, formatted printable summary. |
| `/simulation` | **Scenario Simulation Lab** | 10 reproducible test scenarios (duplicates, contradictions, stale sources, missing fields, etc.). |
| `/audit` | **Immutable Audit Trail** | Append-only event viewer preserving actor, action, previous/resulting states, and timestamps. |
| `/security` | **Cybersecurity Centre** | Defensive security posture overview, session TTL, lockout telemetry, PBKDF2 cryptography inspection. |
| `/admin/users` | **User & Role Administration** | Admin-only route: provision accounts, modify roles, deactivate users with self-lockout prevention. |
| `/documentation` | **Documentation & Limits** | Technical architecture, data flow diagrams, prototype boundaries, institutional deployment roadmap. |

---

## 5. Demonstration Accounts (Pre-Seeded)

The system automatically initializes 4 distinct role-based demonstration accounts with secure PBKDF2-HMAC-SHA256 hashed passwords:

| Username | Role | Password | Operational Scope |
|---|---|---|---|
| `admin` | **Administrator** | `SentinelAdminDemo#2026` | Full administrative control: user provisioning, demo resets, audit inspection, system configuration. |
| `analyst` | **Analyst** | `SentinelAnalystDemo#2026` | Telemetry ingestion, CSV uploads, correlation cycle execution, report inspection. |
| `reviewer` | **Reviewer** | `SentinelReviewerDemo#2026` | Operational review queue, recommendation acceptance, priority corrections with mandatory justifications. |
| `observer` | **Read-only Observer** | `SentinelObserverDemo#2026` | Read-only inspection of reports, incidents, and dashboards. Mutations blocked server-side. |

---

## 6. How to Run Locally

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm (Tested on Node v24.18.0 / npm 11.16.0)

### Step 1: Start the Backend Server
```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Run FastAPI backend on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend automatically creates the SQLite database at `backend/app/data/sentinelfusion.db`, initializes tables, seeds demo accounts, and seeds 14 baseline synthetic demonstration reports.*

### Step 2: Start the Frontend Application
```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```

### Step 3: Open in Browser
Open **`http://127.0.0.1:5173/`** in any modern web browser.
Click **"Sign In to Console"** and use any of the quick-fill buttons (`admin`, `analyst`, `reviewer`, `observer`).

---

## 7. Automated Test Suite Results

The platform includes a comprehensive backend automated test suite (`backend/tests/test_all.py`) covering:
- Authentication, session validation, and generic error verification
- Role-based access control (RBAC) server enforcement
- Report ingestion and strict CSV quarantine for malformed rows
- Deduplication without false corroboration
- Multi-source spatial-temporal clustering
- Contradictory observations detection and penalty
- Insufficient evidence outcome for low-confidence solitary records
- Mandatory justification enforcement on priority corrections
- Append-only audit logging preservation
- 10 simulation scenarios execution
- Defensive security headers verification

### Actual Test Execution Output:
```text
----------------------------------------------------------------------
Ran 15 tests in 2.694s

OK
```
*All 15 automated test cases executed and passed with 100% success.*

---

## 8. Safe Public Demonstration Guidelines

For hackathons, evaluators, and public exhibitions:
1. **Always Use Synthetic Data**: Never input real operational troop locations, live sensor feeds, or sensitive military coordinates.
2. **Do Not Commit Secrets**: Keep `.env` files out of version control. The demo uses secure development defaults.
3. **Display the Synthetic Disclaimer**: The system automatically enforces top and bottom disclaimers throughout all 16 pages and HTTP headers.
4. **Isolated Host**: Run on a self-contained laptop or standalone server without external database connections.

---

## 9. Future Institutional Deployment Prerequisites

Before evaluating this prototype for institutional defence deployment:
1. **Hardware Security Module (HSM)**: Transition JWT secrets to FIPS 140-3 Level 3 hardware security modules.
2. **PKI Defence Smart-Cards**: Enforce mutual TLS (mTLS) and PKI smart-cards for officer sign-ins.
3. **Air-Gapped Enclave**: Deploy on physically air-gapped server racks with unidirectional optical data diodes.
4. **VAPT Certification**: Undergo formal vulnerability assessment and penetration testing audits by authorized agencies.
