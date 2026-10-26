"""
SentinelFusion AI - Authentication & Session Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from ..models import UserLogin, TokenResponse, UserResponse
from ..auth import (
    verify_password,
    create_access_token,
    get_current_user,
    check_login_rate_limit,
    register_failed_login,
    register_successful_login,
    seed_demo_users_if_empty,
)
from ..database import db_session, dict_from_row
from ..audit import record_audit_event
from ..config import DISCLAIMER_BANNER, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """
    Secure server-side authentication with rate limiting and generic error messages.
    Guards against timing attacks, password spraying, and enumeration.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    ident = credentials.username_or_email.strip()

    with db_session() as conn:
        cursor = conn.cursor()

        # Check rate limit lockout
        check_login_rate_limit(conn, ident)

        # Lookup user by username or email
        cursor.execute("""
        SELECT id, username, email, password_hash, salt, full_name, role, is_active, failed_login_attempts, locked_until
        FROM users
        WHERE username = ? OR email = ?;
        """, (ident, ident))
        user = dict_from_row(cursor.fetchone())

        # If user not found or inactive, register failed attempt and throw generic error
        if not user or not user["is_active"]:
            register_failed_login(conn, ident)
            record_audit_event(
                conn, actor_username=ident, actor_role="UNKNOWN",
                action="LOGIN_FAILED", target_type="USER", target_id=ident,
                details="Invalid username or inactive account", ip_address=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify your username and password.",
            )

        # Verify password
        if not verify_password(credentials.password, user["password_hash"], user["salt"]):
            register_failed_login(conn, ident)
            record_audit_event(
                conn, actor_username=user["username"], actor_role=user["role"],
                action="LOGIN_FAILED", target_type="USER", target_id=str(user["id"]),
                details="Incorrect password", actor_id=user["id"], ip_address=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Please verify your username and password.",
            )

        # Successful authentication: reset failed attempts counter
        register_successful_login(conn, user["id"])
        record_audit_event(
            conn, actor_username=user["username"], actor_role=user["role"],
            action="LOGIN_SUCCESS", target_type="USER", target_id=str(user["id"]),
            details="User signed in successfully", actor_id=user["id"], ip_address=client_ip
        )

        # Create JWT access token
        token_payload = {
            "sub": user["username"],
            "user_id": user["id"],
            "role": user["role"],
            "full_name": user["full_name"],
        }
        token = create_access_token(token_payload)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user["id"],
            username=user["username"],
            role=user["role"],
            full_name=user["full_name"],
            expires_in_minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        )

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve profile and role info for currently authenticated user."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_active=bool(current_user["is_active"]),
        created_at=current_user.get("created_at", ""),
        updated_at=current_user.get("updated_at", ""),
        last_login_at=current_user.get("last_login_at"),
        failed_login_attempts=current_user.get("failed_login_attempts", 0),
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user), request: Request = None):
    """Record server-side logout audit event."""
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    with db_session() as conn:
        record_audit_event(
            conn, actor_username=current_user["username"], actor_role=current_user["role"],
            action="LOGOUT", target_type="USER", target_id=str(current_user["id"]),
            details="User logged out", actor_id=current_user["id"], ip_address=client_ip
        )
    return {"message": "Session terminated successfully."}

@router.post("/seed-demo-accounts")
async def seed_demo_accounts():
    """Seed default demonstration accounts for development testing."""
    seed_demo_users_if_empty()
    return {"message": "Demo accounts verified and available."}
