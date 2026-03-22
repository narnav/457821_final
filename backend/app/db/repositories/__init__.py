"""
Repository layer for Lumo database access.

Re-exports all repository functions for clean imports.
"""

from backend.app.db.repositories.attempts import create_attempt, create_exercise_instance
from backend.app.db.repositories.profiles import (
    create_or_update_user_profile,
    get_user_profile_by_user_id,
)
from backend.app.db.repositories.state import (
    create_user_state,
    get_user_state,
    update_user_state,
)
from backend.app.db.repositories.users import (
    create_user,
    get_user_by_email,
    get_user_by_id,
)

__all__ = [
    # User repository
    "create_user",
    "get_user_by_id",
    "get_user_by_email",
    # Profile repository
    "create_or_update_user_profile",
    "get_user_profile_by_user_id",
    # State repository
    "get_user_state",
    "create_user_state",
    "update_user_state",
    # Exercise/Attempt repository
    "create_exercise_instance",
    "create_attempt",
]
