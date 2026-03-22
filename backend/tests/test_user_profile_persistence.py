"""Tests for UserProfile persistence layer.

Verifies that:
- Onboarding persists a UserProfileRecord
- Attempt flow uses persisted profile instead of degraded reconstruction
- Attempt without a persisted profile fails with 409
- Profile data round-trips correctly through persistence
"""

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from backend.app.api.auth import _get_db as auth_get_db, auth_router
from backend.app.api.routes import _get_db, router
from backend.app.core.curriculum_loader import CurriculumData
from backend.app.core.security import create_access_token
from backend.app.db.models import User, UserProfileRecord, UserState
from backend.app.db.repositories.profiles import (
    create_or_update_user_profile,
    get_user_profile_by_user_id,
)
from backend.app.models.curriculum import CurriculumPlan, ModuleInfo, Pacing
from backend.app.models.exercise import ExerciseDefinition, ExerciseType
from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MODULES = (
    ModuleInfo(module_id="mod_0", name="Intro", order=0, is_skippable=False),
)


def _build_curriculum() -> CurriculumData:
    exercises = (
        ExerciseDefinition(
            exercise_id="ex_0", name="Exercise 0", module_id="mod_0",
            exercise_type=ExerciseType.GUIDED_PRACTICE, skills=("basics",), order=0,
        ),
        ExerciseDefinition(
            exercise_id="ex_1", name="Exercise 1", module_id="mod_0",
            exercise_type=ExerciseType.GUIDED_PRACTICE, skills=("basics",), order=1,
        ),
    )
    return CurriculumData(
        track_id="test", track_name="Test", modules=MODULES,
        exercises_by_module={"mod_0": exercises},
    )


def _make_plan(user_id: str) -> CurriculumPlan:
    return CurriculumPlan(
        user_id=user_id, track_id="test", modules=MODULES,
        pacing=Pacing.NORMAL, allow_exploration=False, skip_modules=(),
    )


def _mock_mentor():
    m = MagicMock()
    resp = MagicMock()
    resp.hint = "h"
    resp.encouragement = "e"
    resp.next_action = "n"
    resp.model_dump.return_value = {"hint": "h", "encouragement": "e", "next_action": "n"}
    m.generate_response.return_value = resp
    return m


def _auth_header(user_id):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture()
def user(db):
    uid = uuid4()
    u = User(id=uid, first_name="T", last_name="U", email=f"{uid}@test.com", age=25)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture()
def client(db):
    app = FastAPI()
    app.include_router(router)
    app.include_router(auth_router)

    def _override():
        yield db

    app.dependency_overrides[_get_db] = _override
    app.dependency_overrides[auth_get_db] = _override
    return TestClient(app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch("backend.app.api.routes._curriculum_agent")
@patch("backend.app.api.routes._profiler")
def test_onboarding_persists_profile(mock_profiler, mock_ca, mock_load, client, user, db):
    """Onboarding creates a UserProfileRecord in the database."""
    profile = UserProfile(
        user_id=str(user.id), inferred_skill_level=SkillLevel.INTERMEDIATE,
        confidence_score=0.55, learning_style=LearningStyle.STRUCTURED,
        initial_track="python_basics", preferred_languages=("en", "fr"),
        raw_input=OnboardingInput(age=25, prior_experience="some"),
    )
    mock_profiler.profile.return_value = profile
    mock_ca.plan.return_value = _make_plan(str(user.id))

    resp = client.post(f"/users/{user.id}/onboarding", json={"prior_experience": "some"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 200

    record = get_user_profile_by_user_id(db, user.id)
    assert record is not None
    assert record.skill_level == "intermediate"
    assert record.confidence_score == 0.55
    assert record.learning_style == "structured"
    assert record.initial_track == "python_basics"


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch("backend.app.api.routes._mentor", new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code")
def test_attempt_uses_persisted_profile(mock_diag, mock_mentor, mock_load, client, user, db):
    """Attempt flow uses the real persisted profile, not a degraded reconstruction."""
    from backend.app.core.diagnostics import DiagnosticsResult

    # Seed profile and state
    profile = UserProfile(
        user_id=str(user.id), inferred_skill_level=SkillLevel.ADVANCED,
        confidence_score=0.8, learning_style=LearningStyle.FAST_TRACK,
        initial_track="python_basics", preferred_languages=("en",),
        raw_input=OnboardingInput(prior_experience="experienced"),
    )
    create_or_update_user_profile(db, profile)
    state = UserState(user_id=user.id, curriculum_version="v1", module_index=0, exercise_index=0, pacing="fast")
    db.add(state)
    db.commit()

    mock_diag.return_value = DiagnosticsResult(diagnostics=(), has_errors=False)

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 200

    # Verify mentor was called with the real profile (ADVANCED, not INTERMEDIATE fallback)
    call_args = mock_mentor.generate_response.call_args
    used_profile = call_args[0][0]
    assert used_profile.inferred_skill_level == SkillLevel.ADVANCED
    assert used_profile.confidence_score == 0.8
    assert used_profile.learning_style == LearningStyle.FAST_TRACK


def test_attempt_without_profile_returns_409(client, user):
    """Attempt without onboarding returns a clear 409 error."""
    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 409
    assert "onboarding required" in resp.json()["detail"].lower()


def test_profile_round_trip(db):
    """Profile data survives create -> read round-trip without loss."""
    uid = uuid4()
    u = User(id=uid, first_name="R", last_name="T", email=f"{uid}@test.com")
    db.add(u)
    db.commit()

    profile = UserProfile(
        user_id=str(uid), inferred_skill_level=SkillLevel.BEGINNER,
        confidence_score=0.35, learning_style=LearningStyle.EXPLORATORY,
        initial_track="python_basics", preferred_languages=("en", "es"),
        raw_input=OnboardingInput(age=30, prior_experience="none", learning_goals=("explore",)),
    )
    create_or_update_user_profile(db, profile)

    record = get_user_profile_by_user_id(db, uid)
    assert record is not None
    assert record.skill_level == "beginner"
    assert record.learning_style == "exploratory"
    assert record.confidence_score == pytest.approx(0.35)

    # Verify JSON fields parse back correctly
    import json
    langs = json.loads(record.preferred_languages_json)
    assert langs == ["en", "es"]

    raw = OnboardingInput.model_validate_json(record.raw_input_json)
    assert raw.age == 30
    assert raw.prior_experience == "none"
    assert raw.learning_goals == ("explore",)
