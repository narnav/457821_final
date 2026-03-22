"""JWT and password hashing utilities for Lumo auth."""

import os
import warnings
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_DEV_SECRET = "lumo-dev-secret-do-not-use-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def _load_secret() -> str:
    """Load JWT secret from environment, falling back to dev secret with a warning."""
    secret = os.environ.get("LUMO_JWT_SECRET")
    if secret:
        return secret
    warnings.warn(
        "LUMO_JWT_SECRET not set — using insecure dev secret. "
        "Set LUMO_JWT_SECRET in environment for production.",
        stacklevel=2,
    )
    return _DEV_SECRET


_cached_secret: Optional[str] = None


def get_jwt_secret() -> str:
    """Return the JWT secret, resolving lazily on first call."""
    global _cached_secret
    if _cached_secret is None:
        _cached_secret = _load_secret()
    return _cached_secret


_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------


def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt (includes salt)."""
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return _pwd_ctx.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def create_access_token(
    user_id: UUID,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT containing user_id as ``sub``."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[str]:
    """Decode a JWT and return the ``sub`` (user_id) or None on failure."""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
