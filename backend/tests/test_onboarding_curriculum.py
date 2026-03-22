"""Tests for CurriculumAgent integration in the onboarding flow.

Verifies that:
- Onboarding uses CurriculumAgent to derive initial UserState
- Pacing comes from CurriculumPlan, not manual fallback
- Advanced users honor module skipping from the plan
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
from backend.app.models.curriculum import CurriculumPlan, ModuleInfo, Pacing
from backend.app.models.user import LearningStyle, SkillLevel, UserProfile, OnboardingInput
from backend.app.db.models import User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MODULES = (
    ModuleInfo(module_id="mod_0", name="Intro", order=0, is_skippable=False),
    ModuleInfo(module_id="mod_1", name="Basics", order=1, is_skippable=False),
    ModuleInfo(module_id="mod_2", name="Intermediate", order=2, is_skippable=False),
    ModuleInfo(module_id="mod_3", name="Advanced A", order=3, is_skippable=True),
    ModuleInfo(module_id="mod_4", name="Advanced B", order=4, is_skippable=True),
)

CURRICULUM = CurriculumData(
    track_id="python_basics", track_name="Python Basics",
    modules=MODULES, exercises_by_module={m.module_id: () for m in MODULES},
)


def _make_profile(user_id: str, skill: SkillLevel, style: LearningStyle, confidence: float = 0.5) -> UserProfile:
    return UserProfile(
        user_id=user_id, inferred_skill_level=skill, confidence_score=confidence,
        learning_style=style, initial_track="python_basics",
        preferred_languages=("en",), raw_input=OnboardingInput(),
    )


def _make_plan(user_id: str, modules: tuple[ModuleInfo, ...], pacing: Pacing,
               skip_modules: tuple[str, ...] = ()) -> CurriculumPlan:
    return CurriculumPlan(
        user_id=user_id, track_id="python_basics", modules=modules,
        pacing=pacing, allow_exploration=False, skip_modules=skip_modules,
    )


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

@patch("backend.app.api.routes.load_curriculum", return_value=CURRICULUM)
@patch("backend.app.api.routes._curriculum_agent")
@patch("backend.app.api.routes._profiler")
def test_onboarding_uses_curriculum_agent(mock_profiler, mock_ca, mock_load, client, user):
    """Onboarding calls CurriculumAgent.plan and uses its output."""
    profile = _make_profile(str(user.id), SkillLevel.BEGINNER, LearningStyle.STRUCTURED)
    plan = _make_plan(str(user.id), MODULES, Pacing.NORMAL)

    mock_profiler.profile.return_value = profile
    mock_ca.plan.return_value = plan

    resp = client.post(f"/users/{user.id}/onboarding", json={"prior_experience": "none"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 200

    # CurriculumAgent.plan was called with profile and curriculum modules
    mock_ca.plan.assert_called_once()
    call_args = mock_ca.plan.call_args
    assert call_args[0][0] is profile
    assert call_args[0][1] is CURRICULUM.modules

    body = resp.json()
    assert body["pacing"] == "normal"


@patch("backend.app.api.routes.load_curriculum", return_value=CURRICULUM)
@patch("backend.app.api.routes._curriculum_agent")
@patch("backend.app.api.routes._profiler")
def test_pacing_from_curriculum_plan(mock_profiler, mock_ca, mock_load, client, user):
    """Pacing in the response comes from CurriculumPlan, not manual derivation."""
    profile = _make_profile(str(user.id), SkillLevel.ADVANCED, LearningStyle.FAST_TRACK, confidence=0.8)
    plan = _make_plan(str(user.id), MODULES, Pacing.FAST)

    mock_profiler.profile.return_value = profile
    mock_ca.plan.return_value = plan

    resp = client.post(f"/users/{user.id}/onboarding",
                       json={"prior_experience": "experienced", "pace_preference": "fast"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 200
    assert resp.json()["pacing"] == "fast"


@patch("backend.app.api.routes.load_curriculum", return_value=CURRICULUM)
@patch("backend.app.api.routes._curriculum_agent")
@patch("backend.app.api.routes._profiler")
def test_advanced_user_skips_modules(mock_profiler, mock_ca, mock_load, client, user, db):
    """Advanced user with skipped modules starts at the correct module_index."""
    # Plan skips mod_0 and mod_1, starting at mod_2
    included = (MODULES[2], MODULES[3], MODULES[4])
    profile = _make_profile(str(user.id), SkillLevel.ADVANCED, LearningStyle.FAST_TRACK, confidence=0.8)
    plan = _make_plan(str(user.id), included, Pacing.FAST, skip_modules=("mod_0", "mod_1"))

    mock_profiler.profile.return_value = profile
    mock_ca.plan.return_value = plan

    resp = client.post(f"/users/{user.id}/onboarding", json={"prior_experience": "experienced"},
                       headers=_auth_header(user.id))
    assert resp.status_code == 200

    # Verify UserState was created with module_index=2 (position of mod_2 in original curriculum)
    from backend.app.db import get_user_state
    state = get_user_state(db, user.id)
    assert state.module_index == 2
    assert state.exercise_index == 0
    assert state.pacing == "fast"


@patch("backend.app.api.routes.load_curriculum", return_value=CURRICULUM)
@patch("backend.app.api.routes._curriculum_agent")
@patch("backend.app.api.routes._profiler")
def test_beginner_starts_at_module_zero(mock_profiler, mock_ca, mock_load, client, user, db):
    """Beginner user starts at module_index=0 with normal pacing."""
    profile = _make_profile(str(user.id), SkillLevel.BEGINNER, LearningStyle.STRUCTURED)
    plan = _make_plan(str(user.id), MODULES, Pacing.NORMAL)

    mock_profiler.profile.return_value = profile
    mock_ca.plan.return_value = plan

    resp = client.post(f"/users/{user.id}/onboarding", json={}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    from backend.app.db import get_user_state
    state = get_user_state(db, user.id)
    assert state.module_index == 0
    assert state.pacing == "normal"
