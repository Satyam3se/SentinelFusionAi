"""
SentinelFusion AI - Main FastAPI Application
Configures Security Headers, CORS, Database Lifecycles, and API Routing.
"""
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import ALLOWED_ORIGINS, DISCLAIMER_BANNER
from .database import init_db, db_session
from .auth import seed_demo_users_if_empty
from .simulation_engine import generate_standard_demo_dataset
from .correlation_engine import run_correlation_cycle

# Import routers
from .routes.auth_routes import router as auth_router
from .routes.report_routes import router as report_router
from .routes.incident_routes import router as incident_router
from .routes.review_routes import router as review_router
from .routes.source_health_routes import router as source_health_router
from .routes.situation_report_routes import router as sitrep_router
from .routes.simulation_routes import router as simulation_router
from .routes.audit_routes import router as audit_router
from .routes.security_routes import router as security_router
from .routes.admin_routes import router as admin_router
from .routes.tactical_routes import router as tactical_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("sentinelfusion.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing SentinelFusion AI backend...")
    init_db()
    seed_demo_users_if_empty()

    # Automatically check if demo reports exist; if empty, seed baseline dataset
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM reports;")
        if cursor.fetchone()[0] == 0:
            logger.info("Database reports table empty. Seeding baseline synthetic demonstration reports...")
            generate_standard_demo_dataset(conn)
            run_correlation_cycle(conn)
            logger.info("Baseline synthetic dataset initialized and correlated.")

    yield
    logger.info("SentinelFusion AI backend shutdown complete.")

app = FastAPI(
    title="SentinelFusion AI Platform",
    description="Defence Situational Awareness, Intelligence Correlation & Decision Support Platform (Independent Synthetic Prototype)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration (Permissive for evaluation prototype & cloud deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Security Headers & Synthetic Disclaimer Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Injects defensive HTTP headers and synthetic disclaimer headers."""
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000;"
    )
    response.headers["X-Sentinel-Synthetic-Disclaimer"] = "STRICTLY_SYNTHETIC_DEMO_DATA"
    return response

# Global Exception Handler (Avoid leaking stack traces or internal secrets)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An internal operational error occurred.",
            "detail": "The request could not be completed safely. Check audit logs for details.",
            "synthetic_disclaimer": DISCLAIMER_BANNER,
        }
    )

# Health & Liveness Checks
@app.get("/api/health")
async def health_check():
    """Liveness probe: verifies backend service is reachable."""
    return {
        "status": "HEALTHY",
        "service": "SentinelFusion AI Backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": DISCLAIMER_BANNER,
    }

@app.get("/api/health/ready")
async def readiness_check():
    """Readiness probe: validates database connectivity."""
    try:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            cursor.fetchone()
        return {
            "status": "READY",
            "database": "CONNECTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "UNREADY", "database": "DISCONNECTED", "error": str(e)}
        )

# Register All API Routers
app.include_router(auth_router)
app.include_router(report_router)
app.include_router(incident_router)
app.include_router(review_router)
app.include_router(source_health_router)
app.include_router(sitrep_router)
app.include_router(simulation_router)
app.include_router(audit_router)
app.include_router(security_router)
app.include_router(admin_router)
app.include_router(tactical_router)

# Production Frontend SPA Static Mount (Unified Deployment)
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

potential_dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
    os.path.abspath(os.path.join(os.getcwd(), "static")),
]
frontend_dist_dir = next((p for p in potential_dist_paths if os.path.exists(p) and os.path.isfile(os.path.join(p, "index.html"))), None)

if frontend_dist_dir:
    logger.info(f"Mounting production frontend bundle from: {frontend_dist_dir}")
    assets_dir = os.path.join(frontend_dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path in ["openapi.json", "docs", "redoc"]:
            return JSONResponse(status_code=404, content={"detail": f"Path /{full_path} not found"})

        target_file = os.path.join(frontend_dist_dir, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist_dir, "index.html"))

