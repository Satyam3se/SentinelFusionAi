"""
SentinelFusion AI - Authentication, Cryptography & Role-Based Access Control
"""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any

import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    RATE_LIMIT_MAX_ATTEMPTS,
    RATE_LIMIT_WINDOW_SECONDS,
    ROLES,
)
from .database import db_session, dict_from_row

security_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash password using PBKDF2-HMAC-SHA256 with 600,000 iterations.
    Returns (hex_hash, salt).
    """
    if not salt:
        salt = secrets.token_hex(16)
    hashed_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        600_000,
    )
    return hashed_bytes.hex(), salt

def verify_password(plain_password: str, stored_hash: str, salt: str) -> bool:
    """Constant-time verification of password against stored hash."""
    test_hash, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(test_hash, stored_hash)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT token with standard claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def seed_demo_users_if_empty() -> None:
    """
    Initializes standard development demo accounts if no users exist.
    Passwords follow strong security standards and are securely hashed with salts.
    """
    demo_accounts = [
        {
            "username": "admin",
            "email": "admin.demo@sentinel.defence.local",
            "password": "SentinelAdminDemo#2026",
            "full_name": "Maj. Rajesh Sharma (Administrator)",
            "role": ROLES["ADMINISTRATOR"],
        },
        {
            "username": "analyst",
            "email": "analyst.demo@sentinel.defence.local",
            "password": "SentinelAnalystDemo#2026",
            "full_name": "Capt. Priya Nair (Intelligence Analyst)",
            "role": ROLES["ANALYST"],
        },
        {
            "username": "reviewer",
            "email": "reviewer.demo@sentinel.defence.local",
            "password": "SentinelReviewerDemo#2026",
            "full_name": "Col. Vikram Rathore (Review Officer)",
            "role": ROLES["REVIEWER"],
        },
        {
            "username": "observer",
            "email": "observer.demo@sentinel.defence.local",
            "password": "SentinelObserverDemo#2026",
            "full_name": "Lt. Ananya Deshmukh (Observer)",
            "role": ROLES["OBSERVER"],
        },
    ]

    with db_session() as conn:
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        for acc in demo_accounts:
            cursor.execute("SELECT id FROM users WHERE username = ?;", (acc["username"],))
            if not cursor.fetchone():
                pw_hash, salt = hash_password(acc["password"])
                cursor.execute("""
                INSERT INTO users (username, email, password_hash, salt, full_name, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);
                """, (acc["username"], acc["email"], pw_hash, salt, acc["full_name"], acc["role"], now_iso, now_iso))

def check_login_rate_limit(conn, identifier: str) -> None:
    """Check if account is temporarily locked due to repeated failed attempts."""
    cursor = conn.cursor()
    cursor.execute("SELECT failed_login_attempts, locked_until FROM users WHERE username = ? OR email = ?;", (identifier, identifier))
    row = cursor.fetchone()
    if row and row["locked_until"]:
        try:
            lock_time = datetime.fromisoformat(row["locked_until"])
            now = datetime.now(timezone.utc)
            if now < lock_time:
                remaining_sec = int((lock_time - now).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account temporarily locked due to repeated failed login attempts. Retry in {remaining_sec} seconds."
                )
        except ValueError:
            pass

def register_failed_login(conn, identifier: str) -> None:
    """Increment failed login attempts and lock if threshold exceeded."""
    cursor = conn.cursor()
    cursor.execute("SELECT id, failed_login_attempts FROM users WHERE username = ? OR email = ?;", (identifier, identifier))
    row = cursor.fetchone()
    if row:
        user_id = row["id"]
        attempts = (row["failed_login_attempts"] or 0) + 1
        locked_until = None
        if attempts >= RATE_LIMIT_MAX_ATTEMPTS:
            locked_until = (datetime.now(timezone.utc) + timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)).isoformat()
        cursor.execute("UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?;", (attempts, locked_until, user_id))

def register_successful_login(conn, user_id: int) -> None:
    """Reset failed attempts and record last login timestamp."""
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?;", (now_iso, user_id))

async def get_current_user(
    request: Request = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> Dict[str, Any]:
    """Dependency: Extract and validate JWT bearer token from Authorization header or query param."""
    token = credentials.credentials if (credentials and credentials.credentials) else None
    if not token and request is not None:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please sign in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")

    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, full_name, role, is_active FROM users WHERE username = ?;", (username,))
        user = dict_from_row(cursor.fetchone())
        if not user or not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or not found.")
        return user

def require_role(allowed_roles: List[str]):
    """Role-based authorization dependency factory."""
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of the following roles: {', '.join(allowed_roles)} (Your role: {current_user['role']})."
            )
        return current_user
    return role_checker
