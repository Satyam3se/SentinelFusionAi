"""
SentinelFusion AI - Scenario Simulation & Failure Testing Lab Routes
Provides 10 reproducible scenarios, demo data generation, and expected vs actual behavior comparisons.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..models import ScenarioInfo, SimulationRunResult
from ..auth import get_current_user, require_role
from ..database import db_session
from ..simulation_engine import SCENARIOS, load_simulation_scenario, generate_standard_demo_dataset, reset_demo_dataset
from ..correlation_engine import run_correlation_cycle
from ..audit import record_audit_event

router = APIRouter(prefix="/api/simulation", tags=["Simulation Lab"])

@router.get("/scenarios", response_model=List[ScenarioInfo])
async def list_scenarios(current_user: dict = Depends(get_current_user)):
    """Returns the list of 10 reproducible testing and failure-handling scenarios."""
    return [
        ScenarioInfo(
            id=s["id"],
            title=s["title"],
            description=s["description"],
            expected_outcome=s["expected_outcome"],
            failure_type=s["failure_type"],
        )
        for s in SCENARIOS
    ]

@router.post("/load/{scenario_id}")
async def run_scenario(
    scenario_id: str,
    current_user: dict = Depends(require_role(["Administrator", "Analyst"])),
    request: Request = None,
):
    """Loads a specific scenario and executes the correlation engine to evaluate system response."""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    with db_session() as conn:
        try:
            result = load_simulation_scenario(conn, scenario_id)
            record_audit_event(
                conn, actor_username=current_user["username"], actor_role=current_user["role"],
                action="SCENARIO_SIMULATION_LOADED", target_type="SIMULATION", target_id=scenario_id,
                details=f"Loaded {result['scenario_title']}", actor_id=current_user["id"], ip_address=client_ip
            )
            return result
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/seed-demo")
async def seed_demo_dataset_route(
    current_user: dict = Depends(require_role(["Administrator", "Analyst"])),
    request: Request = None,
):
    """Injects 14 reproducible synthetic demonstration reports and executes initial correlation."""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    with db_session() as conn:
        count = generate_standard_demo_dataset(conn)
        corr_res = run_correlation_cycle(conn)
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="DEMO_DATASET_SEEDED", target_type="SYSTEM", target_id="SYNTHETIC_DATASET",
            details=f"Injected {count} reports, created {corr_res['incidents_created']} incidents",
            actor_id=current_user["id"], ip_address=client_ip
        )
        return {
            "status": "SUCCESS",
            "message": f"Successfully injected {count} synthetic demonstration reports and correlated into {corr_res['incidents_created']} incidents.",
            "reports_seeded": count,
            "incidents_created": corr_res["incidents_created"],
        }

@router.post("/reset")
async def reset_demo_data_route(
    current_user: dict = Depends(require_role(["Administrator"])),
    request: Request = None,
):
    """Safely resets the demonstration dataset to baseline (Admin only)."""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    with db_session() as conn:
        res = reset_demo_dataset(conn)
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="DEMO_DATASET_RESET", target_type="SYSTEM", target_id="SYNTHETIC_DATASET",
            details="Demo dataset reset to initial state", actor_id=current_user["id"], ip_address=client_ip
        )
        return res
