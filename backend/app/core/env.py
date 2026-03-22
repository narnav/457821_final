"""
Load backend/.env into os.environ for local development.

Call ``load_env()`` once at process startup, before any module reads
``os.environ``.  In production the real environment is set by the
deployment layer, so dotenv is a no-op (it never overwrites existing
variables).
"""

from pathlib import Path

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/


def load_env() -> None:
    """Load backend/.env if it exists. Never overwrites existing env vars."""
    env_path = _BACKEND_DIR / ".env"
    load_dotenv(env_path, override=False)
