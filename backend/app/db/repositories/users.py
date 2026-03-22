"""
User repository functions.

Provides CRUD operations for User entities.
"""

from typing import Optional
from uuid import UUID

from sqlmodel import Session, select

from backend.app.db.models import User
from backend.app.observability.logging_config import get_logger, mask_email, safe_user_ref

_log = get_logger("db.repo.users")


def create_user(
    session: Session,
    *,
    first_name: str,
    last_name: str,
    email: str,
    password_hash: Optional[str] = None,
    profile_image_url: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    trace_id: Optional[str] = None,
) -> User:
    """
    Create a new user.

    Args:
        session: Database session
        first_name: User's first name
        last_name: User's last name
        email: User's email (must be unique)
        password_hash: Bcrypt-hashed password
        profile_image_url: Optional profile image URL
        age: Optional age
        gender: Optional gender
        trace_id: Optional correlation ID for log tracing

    Returns:
        Created User instance
    """
    _log.debug("Creating user email=%s", mask_email(email), extra={"stage": "repo", "trace_id": trace_id})
    try:
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=password_hash,
            profile_image_url=profile_image_url,
            age=age,
            gender=gender,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        _log.info(
            "User created",
            extra={"stage": "repo", "user_ref": safe_user_ref(str(user.id)), "entity_id": str(user.id), "trace_id": trace_id},
        )
        return user
    except Exception:
        _log.exception("Failed to create user email=%s", mask_email(email), extra={"trace_id": trace_id})
        raise


def get_user_by_id(session: Session, user_id: UUID) -> Optional[User]:
    """
    Retrieve a user by ID.

    Args:
        session: Database session
        user_id: User's UUID

    Returns:
        User instance or None if not found
    """
    _log.debug("get_user_by_id", extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id))})
    result = session.get(User, user_id)
    _log.debug(
        "get_user_by_id found=%s", result is not None,
        extra={"stage": "repo", "user_ref": safe_user_ref(str(user_id))},
    )
    return result


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """
    Retrieve a user by email.

    Args:
        session: Database session
        email: User's email address

    Returns:
        User instance or None if not found
    """
    _log.debug("get_user_by_email email=%s", mask_email(email), extra={"stage": "repo"})
    statement = select(User).where(User.email == email)
    result = session.exec(statement).first()
    _log.debug(
        "get_user_by_email found=%s", result is not None,
        extra={"stage": "repo"},
    )
    return result
