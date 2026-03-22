"""
Central logging configuration for Lumo.

Configures stdlib logging once with a structured-ish format.
Supports LOG_LEVEL from env (default INFO).
Provides a correlation-id helper for trace context.
Provides HMAC-based user-id hashing for privacy-safe logs.
"""

import hashlib
import hmac
import logging
import os
import uuid
from typing import Optional


_CONFIGURED = False
_SALT_WARNING_EMITTED = False

_DEFAULT_SALT = "dev-default-salt"

LOG_FORMAT = (
    "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    "%(trace_suffix)s%(ctx_suffix)s"
)
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


def _get_salt() -> str:
    """Load LUMO_LOG_SALT from env; warn once and fall back if missing."""
    global _SALT_WARNING_EMITTED
    salt = os.environ.get("LUMO_LOG_SALT")
    if salt:
        return salt
    if not _SALT_WARNING_EMITTED:
        logging.getLogger("lumo.security").warning(
            "LUMO_LOG_SALT not set – using insecure default salt. "
            "Set LUMO_LOG_SALT env var for production."
        )
        _SALT_WARNING_EMITTED = True
    return _DEFAULT_SALT


def hash_user_id(user_id: str) -> str:
    """
    Return a privacy-safe, deterministic token for a user_id.

    Uses HMAC-SHA256 with LUMO_LOG_SALT, truncated to 12 hex chars.
    Format: ``u_<12hex>``  (e.g. ``u_a1b2c3d4e5f6``).
    """
    salt = _get_salt()
    digest = hmac.new(
        salt.encode(), user_id.encode(), hashlib.sha256
    ).hexdigest()
    return f"u_{digest[:12]}"


def safe_user_ref(user_id: Optional[str]) -> Optional[str]:
    """Hash a user_id for logging, or return None if input is None."""
    if user_id is None:
        return None
    return hash_user_id(str(user_id))


class _ContextFormatter(logging.Formatter):
    """Formatter that appends optional trace_id and context fields."""

    def format(self, record: logging.LogRecord) -> str:
        # Build trace suffix
        trace_id = getattr(record, "trace_id", None)
        record.trace_suffix = f" | trace={trace_id}" if trace_id else ""

        # Build context suffix from known extra keys
        ctx_parts: list[str] = []
        for key in ("user_ref", "stage", "entity_id"):
            val = getattr(record, key, None)
            if val is not None:
                ctx_parts.append(f"{key}={val}")
        record.ctx_suffix = f" | {' '.join(ctx_parts)}" if ctx_parts else ""

        return super().format(record)


def configure_logging() -> None:
    """Configure root logger with console handler. Idempotent."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(_ContextFormatter(LOG_FORMAT, datefmt=DATE_FORMAT))

    root = logging.getLogger("lumo")
    root.setLevel(level)
    root.addHandler(handler)
    root.propagate = False

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a child logger under the 'lumo' namespace."""
    configure_logging()
    return logging.getLogger(f"lumo.{name}")


def new_trace_id() -> str:
    """Generate a short correlation ID for connecting logs across stages."""
    return uuid.uuid4().hex[:12]


def mask_email(email: str) -> str:
    """Mask an email address for safe logging. e.g. t***@lumo.dev"""
    if not email or "@" not in email:
        return "***"
    local, domain = email.rsplit("@", 1)
    return f"{local[0]}***@{domain}" if local else f"***@{domain}"
