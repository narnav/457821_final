"""Tests for GET /users/{user_id}/state and GET /users/{user_id}/current-exercise."""

from unittest.mock import patch
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
from backend.app.models.curriculum import ModuleInfo
from backend.app.models.exercise import ExerciseDefinition, ExerciseType


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_exercise(idx: int, module_id: str = "mod_0") -> ExerciseDefinition:
    return ExerciseDefinition(
        exercise_id=f"ex_{idx}",
        name=f"Exercise {idx}",
        module_id=module_id,
        exercise_type=ExerciseType.GUIDED_PRACTICE,
        skills=("basics",),
        order=idx,
        instructions=f"Instructions for exercise {idx}",
        starter_code=f"# starter code {idx}",
        answer_mode="text",
        expected_output=f"output {idx}",
    )


def _build_curriculum(n_modules: int = 2, n_exercises: int = 3) -> CurriculumData:
    modules = []
    exercises_by_module: dict[str, tuple[ExerciseDefinition, ...]] = {}
    for m in range(n_modules):
        mid = f"mod_{m}"
        modules.append(ModuleInfo(module_id=mid, name=f"Module {m}", order=m, is_skippable=False))
        exercises_by_module[mid] = tuple(_make_exercise(i, mid) for i in range(n_exercises))
    return CurriculumData(
        track_id="test", track_name="Test", modules=tuple(modules),
        exercises_by_module=exercises_by_module,
    )


def _auth_header(user_id):
    """Create a Bearer auth header for the given user."""
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
def user_and_state(db):
    uid = uuid4()
    user = User(id=uid, first_name="T", last_name="U", email=f"{uid}@test.com")
    db.add(user)
    profile = UserProfileRecord(
        user_id=uid, skill_level="intermediate", confidence_score=0.5,
        learning_style="structured", initial_track="python_basics",
    )
    db.add(profile)
    state = UserState(user_id=uid, curriculum_version="v1", module_index=0, exercise_index=1, pacing="normal")
    db.add(state)
    db.commit()
    db.refresh(user)
    db.refresh(state)
    return user, state


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


def test_get_state_returns_correct_values(client, user_and_state):
    """GET /users/{id}/state returns the persisted state fields."""
    user, state = user_and_state

    resp = client.get(f"/users/{user.id}/state", headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["module_index"] == state.module_index
    assert body["exercise_index"] == state.exercise_index
    assert body["pacing"] == state.pacing


def test_get_state_user_not_found(client):
    """GET /users/{id}/state returns 401 without valid token."""
    resp = client.get(f"/users/{uuid4()}/state")
    assert resp.status_code == 401


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
def test_get_current_exercise_returns_prompt(mock_curr, client, user_and_state):
    """GET /users/{id}/current-exercise returns exercise details without side-effects."""
    user, state = user_and_state

    resp = client.get(f"/users/{user.id}/current-exercise", headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["exercise_prompt"] == "Exercise 1"
    assert body["module_index"] == 0
    assert body["exercise_index"] == 1
    assert body["exercise_id"] == "ex_1"
    assert body["exercise_type"] == "guided_practice"
    assert body["instructions"] == "Instructions for exercise 1"
    assert body["starter_code"] == "# starter code 1"
    assert body["answer_mode"] == "text"


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
def test_get_current_exercise_does_not_advance_state(mock_curr, client, user_and_state, db):
    """Calling GET /current-exercise multiple times must not change state."""
    user, state = user_and_state
    original_module = state.module_index
    original_exercise = state.exercise_index

    # Call twice
    client.get(f"/users/{user.id}/current-exercise", headers=_auth_header(user.id))
    client.get(f"/users/{user.id}/current-exercise", headers=_auth_header(user.id))

    db.refresh(state)
    assert state.module_index == original_module
    assert state.exercise_index == original_exercise


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum(n_modules=1, n_exercises=1))
def test_get_current_exercise_after_completion_returns_error(mock_curr, client, user_and_state, db):
    """When curriculum is completed (terminal sentinel), return 409."""
    user, state = user_and_state

    # Set terminal sentinel: module_index past end
    state.module_index = 1
    state.exercise_index = 0
    db.commit()

    resp = client.get(f"/users/{user.id}/current-exercise", headers=_auth_header(user.id))
    assert resp.status_code == 409
    assert "completed" in resp.json()["detail"].lower()


def test_current_exercise_rejects_missing_token(client, user_and_state):
    """GET /current-exercise returns 401 without token."""
    user, _ = user_and_state
    resp = client.get(f"/users/{user.id}/current-exercise")
    assert resp.status_code == 401


def test_current_exercise_rejects_wrong_user(client, user_and_state, db):
    """GET /current-exercise returns 403 for wrong user token."""
    user, _ = user_and_state
    # Create a second user so the token resolves in get_current_user
    other_id = uuid4()
    other_user = User(id=other_id, first_name="O", last_name="U", email=f"{other_id}@test.com")
    db.add(other_user)
    db.commit()

    resp = client.get(f"/users/{user.id}/current-exercise", headers=_auth_header(other_id))
    assert resp.status_code == 403
