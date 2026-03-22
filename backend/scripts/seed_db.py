#!/usr/bin/env python3
"""
Canonical database setup and seeding script for Lumo.

Initializes the database schema and seeds dev/test data:
- One deterministic, auth-ready test user (test@lumo.dev)
- Several polyfactory-generated users with full relationship graphs

Usage:
    python -m backend.scripts.seed_db

Seed user credentials:
    Email:    test@lumo.dev
    Password: value of LUMO_SEED_USER_PASSWORD env var (default: lumo-dev-123)
"""

import os
import sys
import warnings
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Load backend/.env before reading any env vars
from backend.app.core.env import load_env

load_env()

from sqlmodel import Session, select

from backend.app.core.constants import CURRICULUM_VERSION
from backend.app.core.security import hash_password
from backend.app.db import (
    Attempt,
    ExerciseInstance,
    User,
    UserProfileRecord,
    UserState,
    engine,
    init_db,
)
from backend.app.db.repositories import create_user, get_user_by_email
from backend.app.observability.logging_config import get_logger, new_trace_id, safe_user_ref
from backend.scripts.factories import (
    AttemptFactory,
    ExerciseInstanceFactory,
    UserProfileRecordFactory,
    UserStateFactory,
)

_log = get_logger("script.seed")

# ---------------------------------------------------------------------------
# Seed password helpers (also used by tests)
# ---------------------------------------------------------------------------

_DEV_SEED_PASSWORD = "lumo-dev-123"

NUM_FACTORY_USERS = 4


def _get_seed_password() -> str:
    """Read seed user password from env; fall back to dev default with a warning."""
    password = os.environ.get("LUMO_SEED_USER_PASSWORD")
    if password:
        return password
    warnings.warn(
        "LUMO_SEED_USER_PASSWORD not set — using insecure dev default. "
        "Set LUMO_SEED_USER_PASSWORD in backend/.env for a custom seed password.",
        stacklevel=2,
    )
    return _DEV_SEED_PASSWORD


# ---------------------------------------------------------------------------
# Deterministic test user
# ---------------------------------------------------------------------------


def _seed_deterministic_user(session: Session, trace_id: str) -> User:
    """Create or fetch the deterministic dev/test user (test@lumo.dev)."""
    existing = get_user_by_email(session, "test@lumo.dev")
    if existing:
        print(f"    Deterministic user already exists: {existing.email} (id={existing.id})")
        _log.info("Deterministic user exists", extra={"stage": "seed", "user_ref": safe_user_ref(str(existing.id)), "trace_id": trace_id})
        return existing

    seed_password = _get_seed_password()
    user = create_user(
        session,
        first_name="Test",
        last_name="User",
        email="test@lumo.dev",
        password_hash=hash_password(seed_password),
        age=25,
        gender="prefer_not_to_say",
    )

    # UserState
    state = UserState(
        user_id=user.id,
        curriculum_version=CURRICULUM_VERSION,
        module_index=0,
        exercise_index=0,
        pacing="normal",
    )
    session.add(state)

    # UserProfileRecord
    profile = UserProfileRecord(
        user_id=user.id,
        skill_level="beginner",
        confidence_score=0.5,
        learning_style="hands-on",
        initial_track="python_fundamentals",
    )
    session.add(profile)

    session.commit()
    print(f"    Created deterministic user: {user.email} (id={user.id})")
    _log.info("Deterministic user created", extra={"stage": "seed", "user_ref": safe_user_ref(str(user.id)), "trace_id": trace_id})
    return user


# ---------------------------------------------------------------------------
# Factory-generated users
# ---------------------------------------------------------------------------


def _seed_factory_users(session: Session, trace_id: str) -> None:
    """Generate polyfactory users with full relationship graphs."""
    counts = {"users": 0, "profiles": 0, "states": 0, "exercises": 0, "attempts": 0}

    for i in range(NUM_FACTORY_USERS):
        # Build user with a hashed password so they're auth-ready
        user = User(
            first_name=f"Dev{i + 1}",
            last_name=f"User{i + 1}",
            email=f"dev{i + 1}@lumo.dev",
            password_hash=hash_password("factory-pass-123"),
            age=20 + i * 5,
            gender="prefer_not_to_say",
        )
        session.add(user)
        session.flush()
        counts["users"] += 1

        # UserState
        state = UserStateFactory.build(user_id=user.id)
        session.add(state)
        counts["states"] += 1

        # UserProfileRecord
        profile = UserProfileRecordFactory.build(user_id=user.id)
        session.add(profile)
        counts["profiles"] += 1

        # 2 exercise instances per user
        for _ in range(2):
            exercise = ExerciseInstanceFactory.build(user_id=user.id)
            session.add(exercise)
            session.flush()
            counts["exercises"] += 1

            # 2 attempts per exercise
            for _ in range(2):
                attempt = AttemptFactory.build(
                    user_id=user.id,
                    exercise_instance_id=exercise.id,
                )
                session.add(attempt)
                counts["attempts"] += 1

        print(f"    [{i + 1}/{NUM_FACTORY_USERS}] Created: {user.first_name} {user.last_name} <{user.email}>")

    session.commit()
    _log.info(
        "Factory users seeded users=%d profiles=%d states=%d exercises=%d attempts=%d",
        counts["users"], counts["profiles"], counts["states"], counts["exercises"], counts["attempts"],
        extra={"stage": "seed", "trace_id": trace_id},
    )


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------


def _verify(session: Session) -> None:
    """Query and display counts for all tables."""
    users = session.exec(select(User)).all()
    states = session.exec(select(UserState)).all()
    profiles = session.exec(select(UserProfileRecord)).all()
    exercises = session.exec(select(ExerciseInstance)).all()
    attempts = session.exec(select(Attempt)).all()

    print(f"\n    TABLE SUMMARY")
    print(f"    {'-' * 40}")
    print(f"    Users:              {len(users)}")
    print(f"    UserStates:         {len(states)}")
    print(f"    UserProfileRecords: {len(profiles)}")
    print(f"    ExerciseInstances:  {len(exercises)}")
    print(f"    Attempts:           {len(attempts)}")
    print(f"    {'-' * 40}")

    # Auth check: deterministic user has password_hash
    test_user = get_user_by_email(session, "test@lumo.dev")
    if test_user and test_user.password_hash:
        print(f"\n    AUTH CHECK: test@lumo.dev has password_hash ✓")
    else:
        print(f"\n    AUTH CHECK: test@lumo.dev MISSING password_hash ✗")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


def seed_database() -> None:
    """Initialize database and seed all dev/test data."""
    trace_id = new_trace_id()
    _log.info("Seed START", extra={"stage": "seed", "trace_id": trace_id})

    print("=" * 60)
    print("LUMO DATABASE SEED")
    print("=" * 60)

    # Step 1: Initialize database
    print("\n[1] Initializing database...")
    init_db()
    print("    Tables ready.")

    try:
        with Session(engine) as session:
            # Step 2: Deterministic test user
            print("\n[2] Seeding deterministic test user...")
            _seed_deterministic_user(session, trace_id)

            # Step 3: Factory-generated users
            print(f"\n[3] Seeding {NUM_FACTORY_USERS} factory-generated users...")
            _seed_factory_users(session, trace_id)

            # Step 4: Verification
            print("\n[4] Verifying data...")
            _verify(session)
    except Exception:
        _log.exception("Seed failed", extra={"trace_id": trace_id})
        raise

    print("\n" + "=" * 60)
    print("SEEDING COMPLETE")
    print("=" * 60)
    _log.info("Seed END", extra={"stage": "seed", "trace_id": trace_id})


if __name__ == "__main__":
    seed_database()
