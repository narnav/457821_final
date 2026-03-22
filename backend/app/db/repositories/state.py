"""
UserState repository functions.

Provides CRUD operations for UserState entities.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from backend.app.db.models import UserState
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("db.repo.state")


def get_user_state(session: Session, user_id: UUID) -> Optional[UserState]:
    """
    Retrieve the current learning state for a user.

    Args:
        session: Database session
        user_id: User's UUID

    Returns:
        UserState instance or None if not found
    """
    _log.debug("get_user_state", extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id))})
    statement = select(UserState).where(UserState.user_id == user_id)
    result = session.exec(statement).first()
    _log.debug(
        "get_user_state found=%s", result is not None,
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id))},
    )
    return result


def create_user_state(
    session: Session,
    *,
    user_id: UUID,
    curriculum_version: str,
    module_index: int = 0,
    exercise_index: int = 0,
    pacing: str = "normal",
    trace_id: Optional[str] = None,
) -> UserState:
    """
    Create initial learning state for a user.

    Args:
        session: Database session
        user_id: User's UUID
        curriculum_version: Version of the curriculum
        module_index: Starting module index
        exercise_index: Starting exercise index
        pacing: Learning pace (slow/normal/fast)
        trace_id: Optional correlation ID for log tracing

    Returns:
        Created UserState instance
    """
    _log.debug(
        "Creating user_state module=%d exercise=%d pacing=%s",
        module_index, exercise_index, pacing,
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id},
    )
    try:
        state = UserState(
            user_id=user_id,
            curriculum_version=curriculum_version,
            module_index=module_index,
            exercise_index=exercise_index,
            pacing=pacing,
        )
        session.add(state)
        session.commit()
        session.refresh(state)
        _log.info(
            "UserState created",
            extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "entity_id": str(state.id), "trace_id": trace_id},
        )
        return state
    except Exception:
        _log.exception("Failed to create user_state", extra={"user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id})
        raise


def update_user_state(
    session: Session,
    user_id: UUID,
    *,
    module_index: Optional[int] = None,
    exercise_index: Optional[int] = None,
    pacing: Optional[str] = None,
    trace_id: Optional[str] = None,
) -> Optional[UserState]:
    """
    Update a user's learning state.

    Args:
        session: Database session
        user_id: User's UUID
        module_index: New module index (optional)
        exercise_index: New exercise index (optional)
        pacing: New pacing value (optional)
        trace_id: Optional correlation ID for log tracing

    Returns:
        Updated UserState or None if not found
    """
    _log.debug(
        "Updating user_state module=%s exercise=%s pacing=%s",
        module_index, exercise_index, pacing,
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id},
    )
    state = get_user_state(session, user_id)
    if state is None:
        _log.warning("UserState not found for update", extra={"user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id})
        return None

    if module_index is not None:
        state.module_index = module_index
    if exercise_index is not None:
        state.exercise_index = exercise_index
    if pacing is not None:
        state.pacing = pacing

    state.updated_at = datetime.utcnow()
    session.add(state)
    session.commit()
    session.refresh(state)
    _log.info(
        "UserState updated",
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "entity_id": str(state.id), "trace_id": trace_id},
    )
    return state
