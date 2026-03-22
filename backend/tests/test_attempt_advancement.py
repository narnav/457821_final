"""Tests for attempt endpoint advancement logic.

Verifies that:
- Errors in diagnostics prevent exercise advancement
- Clean code advances the user (code-mode exercises)
- Wrong text answers do not advance (text-mode exercises)
- Correct text answers do advance (text-mode exercises)
- End-of-curriculum completion still works
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
from backend.app.core.diagnostics import (
    Diagnostic,
    DiagnosticCode,
    DiagnosticsResult,
    DiagnosticSeverity,
)
from backend.app.core.security import create_access_token
from backend.app.db.models import Attempt, ExerciseInstance, User, UserProfileRecord, UserState
from backend.app.models.curriculum import ModuleInfo
from backend.app.models.exercise import ExerciseDefinition, ExerciseType

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_exercise(idx: int, module_id: str = "mod_1") -> ExerciseDefinition:
    return ExerciseDefinition(
        exercise_id=f"ex_{idx}",
        name=f"Exercise {idx}",
        module_id=module_id,
        exercise_type=ExerciseType.GUIDED_PRACTICE,
        skills=("basics",),
        order=idx,
    )


def _make_text_exercise(idx: int, module_id: str = "mod_0", expected_output: str = "Hello") -> ExerciseDefinition:
    """Create a text-mode exercise with an expected output answer."""
    return ExerciseDefinition(
        exercise_id=f"ex_{idx}",
        name=f"Exercise {idx}",
        module_id=module_id,
        exercise_type=ExerciseType.GUIDED_PRACTICE,
        skills=("predict_output",),
        order=idx,
        instructions="Predict the output.",
        starter_code='print("Hello")',
        answer_mode="text",
        expected_output=expected_output,
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


def _build_text_curriculum(expected_output: str = "Hello") -> CurriculumData:
    """Build a curriculum with a single text-mode exercise."""
    mid = "mod_0"
    modules = (ModuleInfo(module_id=mid, name="Module 0", order=0, is_skippable=False),)
    exercises = (_make_text_exercise(0, mid, expected_output), _make_text_exercise(1, mid, expected_output))
    return CurriculumData(
        track_id="test", track_name="Test", modules=modules,
        exercises_by_module={mid: exercises},
    )


def _auth_header(user_id):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


DIAG_WITH_ERRORS = DiagnosticsResult(
    diagnostics=(
        Diagnostic(
            code=DiagnosticCode.SYNTAX_ERROR,
            severity=DiagnosticSeverity.ERROR,
            message="bad syntax",
            line=1,
        ),
    ),
    has_errors=True,
)

DIAG_WARNINGS_ONLY = DiagnosticsResult(
    diagnostics=(
        Diagnostic(
            code=DiagnosticCode.UNDEFINED_NAME,
            severity=DiagnosticSeverity.WARNING,
            message="maybe undefined",
            line=1,
        ),
    ),
    has_errors=False,
)

DIAG_CLEAN = DiagnosticsResult(diagnostics=(), has_errors=False)

_MENTOR_PATCH = "backend.app.api.routes._mentor"


def _mock_mentor():
    m = MagicMock()
    resp = MagicMock()
    resp.hint = "h"
    resp.encouragement = "e"
    resp.next_action = "n"
    resp.model_dump.return_value = {"hint": "h", "encouragement": "e", "next_action": "n"}
    m.generate_response.return_value = resp
    return m


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db():
    """Create a fresh in-memory database per test."""
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
    state = UserState(user_id=uid, curriculum_version="v1", module_index=0, exercise_index=0, pacing="normal")
    db.add(state)
    db.commit()
    db.refresh(user)
    db.refresh(state)
    return user, state


@pytest.fixture()
def client(db):
    """TestClient wired to the in-memory session."""
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
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_WITH_ERRORS)
def test_errors_do_not_advance(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """Code with errors keeps user on the same exercise."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "bad code"}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["diagnostics_summary"]["error_count"] == 1
    assert body["state"]["module_index"] == 0
    assert body["state"]["exercise_index"] == 0


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_CLEAN)
def test_clean_code_advances(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """Clean code advances the user to the next exercise."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["state"]["exercise_index"] == 1


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_WARNINGS_ONLY)
def test_warnings_still_advance(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """Warnings alone do not block advancement."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["state"]["exercise_index"] == 1


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum(n_modules=1, n_exercises=1))
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_CLEAN)
def test_end_of_curriculum_completion(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """At the last exercise of the last module, successful submission sets terminal sentinel."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    # Terminal sentinel: module_index == len(modules) == 1
    assert body["state"]["module_index"] == 1
    assert body["state"]["exercise_index"] == 0


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum(n_modules=1, n_exercises=1))
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_WITH_ERRORS)
def test_end_of_curriculum_errors_do_not_complete(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """At the last exercise, errors should NOT trigger the completion sentinel."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "bad"}, headers=_auth_header(user.id))
    assert resp.status_code == 200

    body = resp.json()
    # User should stay on module 0, exercise 0
    assert body["state"]["module_index"] == 0
    assert body["state"]["exercise_index"] == 0


# ---------------------------------------------------------------------------
# Text-mode correctness tests
# ---------------------------------------------------------------------------


@patch("backend.app.api.routes.load_curriculum", return_value=_build_text_curriculum("Hello"))
def test_text_mode_wrong_answer_does_not_advance(mock_curr, client, user_and_state):
    """Text-mode: wrong answer keeps user on the same exercise."""
    user, _ = user_and_state

    resp = client.post(
        f"/users/{user.id}/attempt",
        json={"code": "wrong answer"},
        headers=_auth_header(user.id),
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["passed"] is False
    assert body["state"]["module_index"] == 0
    assert body["state"]["exercise_index"] == 0


@patch("backend.app.api.routes.load_curriculum", return_value=_build_text_curriculum("Hello"))
def test_text_mode_correct_answer_advances(mock_curr, client, user_and_state):
    """Text-mode: correct answer advances the user."""
    user, _ = user_and_state

    resp = client.post(
        f"/users/{user.id}/attempt",
        json={"code": "Hello"},
        headers=_auth_header(user.id),
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["passed"] is True
    assert body["state"]["exercise_index"] == 1


@patch("backend.app.api.routes.load_curriculum", return_value=_build_text_curriculum("Hello"))
def test_text_mode_correct_with_whitespace_advances(mock_curr, client, user_and_state):
    """Text-mode: answer with trailing whitespace/newlines still matches."""
    user, _ = user_and_state

    resp = client.post(
        f"/users/{user.id}/attempt",
        json={"code": "  Hello  \n"},
        headers=_auth_header(user.id),
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["passed"] is True
    assert body["state"]["exercise_index"] == 1


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_CLEAN)
def test_code_mode_reports_passed_true(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """Code-mode: clean code reports passed=True."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "x = 1"}, headers=_auth_header(user.id))
    assert resp.status_code == 200
    assert resp.json()["passed"] is True


@patch("backend.app.api.routes.load_curriculum", return_value=_build_curriculum())
@patch(_MENTOR_PATCH, new_callable=_mock_mentor)
@patch("backend.app.api.routes.analyze_code", return_value=DIAG_WITH_ERRORS)
def test_code_mode_reports_passed_false(mock_diag, mock_mentor, mock_curr, client, user_and_state):
    """Code-mode: code with errors reports passed=False."""
    user, _ = user_and_state

    resp = client.post(f"/users/{user.id}/attempt", json={"code": "bad"}, headers=_auth_header(user.id))
    assert resp.status_code == 200
    assert resp.json()["passed"] is False
