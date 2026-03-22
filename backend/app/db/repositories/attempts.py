"""
Exercise and Attempt repository functions.

Provides CRUD operations for ExerciseInstance and Attempt entities.
"""

from typing import Optional
from uuid import UUID

from sqlmodel import Session

from backend.app.db.models import Attempt, ExerciseInstance
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("db.repo.attempts")


def create_exercise_instance(
    session: Session,
    *,
    user_id: UUID,
    curriculum_version: str,
    module_index: int,
    exercise_index: int,
    prompt_text: str,
    metadata_json: Optional[str] = None,
    trace_id: Optional[str] = None,
) -> ExerciseInstance:
    """
    Create a snapshot of an exercise delivered to a user.

    Args:
        session: Database session
        user_id: User's UUID
        curriculum_version: Version of the curriculum
        module_index: Module index
        exercise_index: Exercise index within module
        prompt_text: The exercise prompt shown to user
        metadata_json: Optional JSON metadata
        trace_id: Optional correlation ID for log tracing

    Returns:
        Created ExerciseInstance
    """
    _log.debug(
        "Creating exercise_instance module=%d exercise=%d",
        module_index, exercise_index,
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id},
    )
    try:
        instance = ExerciseInstance(
            user_id=user_id,
            curriculum_version=curriculum_version,
            module_index=module_index,
            exercise_index=exercise_index,
            prompt_text=prompt_text,
            metadata_json=metadata_json,
        )
        session.add(instance)
        session.commit()
        session.refresh(instance)
        _log.info(
            "ExerciseInstance created",
            extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "entity_id": str(instance.id), "trace_id": trace_id},
        )
        return instance
    except Exception:
        _log.exception(
            "Failed to create exercise_instance", extra={"user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id}
        )
        raise


def create_attempt(
    session: Session,
    *,
    user_id: UUID,
    exercise_instance_id: UUID,
    code: str,
    diagnostics_json: Optional[str] = None,
    mentor_response_json: Optional[str] = None,
    trace_id: Optional[str] = None,
) -> Attempt:
    """
    Create an immutable record of a user attempt.

    Args:
        session: Database session
        user_id: User's UUID
        exercise_instance_id: The exercise instance ID
        code: The code submitted by user
        diagnostics_json: JSON diagnostics result
        mentor_response_json: JSON mentor response
        trace_id: Optional correlation ID for log tracing

    Returns:
        Created Attempt instance
    """
    _log.debug(
        "Creating attempt for exercise_instance=%s code_len=%d",
        str(exercise_instance_id), len(code),
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id},
    )
    try:
        attempt = Attempt(
            user_id=user_id,
            exercise_instance_id=exercise_instance_id,
            code=code,
            diagnostics_json=diagnostics_json,
            mentor_response_json=mentor_response_json,
        )
        session.add(attempt)
        session.commit()
        session.refresh(attempt)
        _log.info(
            "Attempt created",
            extra={
                "stage": "repo",
                "user_ref": safe_user_ref(str(user_id)),
                "entity_id": str(attempt.id),
                "trace_id": trace_id,
            },
        )
        return attempt
    except Exception:
        _log.exception("Failed to create attempt", extra={"user_ref": safe_user_ref(str(user_id)), "trace_id": trace_id})
        raise
