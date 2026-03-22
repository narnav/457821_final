"""
UserProfileRecord repository functions.

Provides persistence for learning profiles produced by UserProfilerAgent.
"""

import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from backend.app.db.models import UserProfileRecord
from backend.app.models.user import OnboardingInput, UserProfile
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("db.repo.profiles")


def create_or_update_user_profile(
    session: Session, profile: UserProfile, *, trace_id: Optional[str] = None,
) -> UserProfileRecord:
    """
    Persist a UserProfile, creating or updating the record.

    Args:
        session: Database session
        profile: Domain UserProfile from UserProfilerAgent
        trace_id: Optional correlation ID for log tracing

    Returns:
        Created or updated UserProfileRecord
    """
    user_id = UUID(profile.user_id)
    user_ref = safe_user_ref(profile.user_id)
    _log.debug("create_or_update_user_profile", extra={"stage": "repo", "user_ref": user_ref, "trace_id": trace_id})

    langs_json = json.dumps(list(profile.preferred_languages))
    raw_json = profile.raw_input.model_dump_json()

    existing = session.exec(
        select(UserProfileRecord).where(UserProfileRecord.user_id == user_id)
    ).first()

    if existing:
        existing.skill_level = profile.inferred_skill_level.value
        existing.confidence_score = profile.confidence_score
        existing.learning_style = profile.learning_style.value
        existing.initial_track = profile.initial_track
        existing.preferred_languages_json = langs_json
        existing.raw_input_json = raw_json
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        _log.info("UserProfileRecord updated", extra={"stage": "repo", "user_ref": user_ref, "trace_id": trace_id})
        return existing

    record = UserProfileRecord(
        user_id=user_id,
        skill_level=profile.inferred_skill_level.value,
        confidence_score=profile.confidence_score,
        learning_style=profile.learning_style.value,
        initial_track=profile.initial_track,
        preferred_languages_json=langs_json,
        raw_input_json=raw_json,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    _log.info("UserProfileRecord created", extra={"stage": "repo", "user_ref": user_ref, "trace_id": trace_id})
    return record


def get_user_profile_by_user_id(session: Session, user_id: UUID) -> Optional[UserProfileRecord]:
    """
    Retrieve the persisted profile for a user.

    Args:
        session: Database session
        user_id: User's UUID

    Returns:
        UserProfileRecord or None if not found
    """
    _log.debug("get_user_profile_by_user_id", extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id))})
    return session.exec(
        select(UserProfileRecord).where(UserProfileRecord.user_id == user_id)
    ).first()
