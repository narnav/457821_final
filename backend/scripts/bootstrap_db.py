#!/usr/bin/env python3
"""
Legacy bootstrap entry point — delegates to the canonical seed script.

Usage:
    python -m backend.scripts.bootstrap_db

Prefer: python -m backend.scripts.seed_db
"""

import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Re-export symbols used by tests
from backend.scripts.seed_db import (  # noqa: F401
    _DEV_SEED_PASSWORD,
    _get_seed_password,
    seed_database,
)


def bootstrap() -> None:
    """Delegate to the canonical seed_database function."""
    seed_database()


if __name__ == "__main__":
    bootstrap()
