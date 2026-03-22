"""Authentication routes for Lumo."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from backend.app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
    verify_token,
)
from backend.app.db import create_user, get_session, get_user_by_email, get_user_by_id
from backend.app.db.models import User
from backend.app.observability import get_logger, mask_email, new_trace_id, safe_user_ref

_log = get_logger("api.auth")
auth_router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class SignupRequest(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int | None = Field(default=None, ge=0, le=150)
    gender: str | None = Field(default=None, max_length=50)


class SignupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID


# ---------------------------------------------------------------------------
# DB dependency (same pattern as routes.py)
# ---------------------------------------------------------------------------


def _get_db():
    yield from get_session()


# ---------------------------------------------------------------------------
# Current-user dependency
# ---------------------------------------------------------------------------


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(_get_db),
) -> User:
    """Extract and validate user from Bearer token."""
    user_id_str = verify_token(token)
    if not user_id_str:
        _log.warning("auth FAIL reason=invalid_token", extra={"stage": "auth"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        uid = UUID(user_id_str)
    except ValueError:
        _log.warning("auth FAIL reason=malformed_token_payload", extra={"stage": "auth"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(session, uid)
    if not user:
        _log.warning("auth FAIL reason=user_not_found",
                      extra={"stage": "auth", "user_ref": safe_user_ref(user_id_str)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_owner(current_user: User, user_id: UUID) -> None:
    """Raise 403 if the authenticated user does not own the requested resource."""
    if current_user.id != user_id:
        _log.warning("auth FAIL reason=ownership_denied requester=%s target=%s",
                      safe_user_ref(str(current_user.id)), safe_user_ref(str(user_id)),
                      extra={"stage": "auth"})
        raise HTTPException(status_code=403, detail="Not authorized to access this resource")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@auth_router.post("/signup", response_model=SignupResponse, status_code=201)
def signup(req: SignupRequest, request: Request, session: Session = Depends(_get_db)):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    _log.info("POST /auth/signup email=%s", mask_email(req.email),
              extra={"stage": "api", "trace_id": trace_id})

    try:
        user = create_user(
            session,
            first_name=req.first_name,
            last_name=req.last_name,
            email=req.email,
            password_hash=hash_password(req.password),
            age=req.age,
            gender=req.gender,
            trace_id=trace_id,
        )
    except IntegrityError:
        session.rollback()
        _log.warning("POST /auth/signup FAIL reason=email_conflict email=%s",
                      mask_email(req.email),
                      extra={"stage": "api", "trace_id": trace_id})
        raise HTTPException(status_code=409, detail="Email already registered")

    token = create_access_token(user.id)
    _log.info("POST /auth/signup OK", extra={
        "stage": "api", "user_ref": safe_user_ref(str(user.id)), "trace_id": trace_id,
    })
    return SignupResponse(access_token=token, user_id=user.id)


@auth_router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, request: Request, session: Session = Depends(_get_db)):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    _log.info("POST /auth/login email=%s", mask_email(req.email),
              extra={"stage": "api", "trace_id": trace_id})

    user = get_user_by_email(session, req.email)
    if not user or not user.password_hash:
        _log.warning("POST /auth/login FAIL reason=invalid_credentials email=%s",
                      mask_email(req.email),
                      extra={"stage": "api", "trace_id": trace_id})
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(req.password, user.password_hash):
        _log.warning("POST /auth/login FAIL reason=invalid_credentials email=%s",
                      mask_email(req.email),
                      extra={"stage": "api", "trace_id": trace_id})
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    _log.info("POST /auth/login OK", extra={
        "stage": "api", "user_ref": safe_user_ref(str(user.id)), "trace_id": trace_id,
    })
    return LoginResponse(access_token=token, user_id=user.id)
