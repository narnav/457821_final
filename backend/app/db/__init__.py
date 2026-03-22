"""
Lumo database layer.

Provides database models, session management, and repository functions.
Core logic remains independent of this layer.
"""

from backend.app.db.models import Attempt, ExerciseInstance, User, UserProfileRecord, UserState
from backend.app.db.repositories import (
    create_attempt,
    create_exercise_instance,
    create_or_update_user_profile,
    create_user,
    create_user_state,
    get_user_by_email,
    get_user_by_id,
    get_user_profile_by_user_id,
    get_user_state,
    update_user_state,
)
from backend.app.db.session import engine, get_session, init_db

__all__ = [
    # Models
    "User",
    "UserState",
    "UserProfileRecord",
    "ExerciseInstance",
    "Attempt",
    # Session
    "engine",
    "get_session",
    "init_db",
    # Repositories
    "create_user",
    "get_user_by_id",
    "get_user_by_email",
    "create_or_update_user_profile",
    "get_user_profile_by_user_id",
    "get_user_state",
    "create_user_state",
    "update_user_state",
    "create_exercise_instance",
    "create_attempt",
]
