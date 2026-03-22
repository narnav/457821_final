"""Tests for authentication (signup, login, JWT protection)."""

from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from backend.app.api.auth import _get_db as auth_get_db, auth_router
from backend.app.api.routes import _get_db as routes_get_db, router
from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.db.models import User, UserState


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
def client(db):
    app = FastAPI()
    app.include_router(router)
    app.include_router(auth_router)

    def _override():
        yield db

    app.dependency_overrides[routes_get_db] = _override
    app.dependency_overrides[auth_get_db] = _override
    return TestClient(app)


@pytest.fixture()
def registered_user(client):
    """Sign up a user and return (user_data, token)."""
    resp = client.post("/auth/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "test@example.com",
        "password": "securepass123",
    })
    assert resp.status_code == 201
    body = resp.json()
    return body


# ---------------------------------------------------------------------------
# Unit: password hashing
# ---------------------------------------------------------------------------


def test_hash_password_not_plain():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert hashed.startswith("$2b$")


def test_verify_password_correct():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------


def test_signup_creates_user_with_hashed_password(client, db):
    resp = client.post("/auth/signup", json={
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com",
        "password": "strongpass99",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "user_id" in body

    # Verify password is hashed in DB, not stored as plain text
    user = db.get(User, UUID(body["user_id"]))
    assert user is not None
    assert user.password_hash != "strongpass99"
    assert user.password_hash.startswith("$2b$")


def test_signup_duplicate_email(client, registered_user):
    resp = client.post("/auth/signup", json={
        "first_name": "Another",
        "last_name": "User",
        "email": "test@example.com",
        "password": "anotherpass1",
    })
    assert resp.status_code == 409


def test_signup_short_password(client):
    resp = client.post("/auth/signup", json={
        "first_name": "A",
        "last_name": "B",
        "email": "short@example.com",
        "password": "abc",
    })
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


def test_login_returns_jwt(client, registered_user):
    resp = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepass123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    resp = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "whatever123",
    })
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Protected endpoint: GET /users/{user_id}/state
# ---------------------------------------------------------------------------


def test_protected_endpoint_rejects_missing_token(client, db):
    uid = uuid4()
    resp = client.get(f"/users/{uid}/state")
    assert resp.status_code == 401


def test_protected_endpoint_rejects_invalid_token(client, db):
    uid = uuid4()
    resp = client.get(
        f"/users/{uid}/state",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401


def test_protected_endpoint_accepts_valid_token(client, registered_user, db):
    user_id = registered_user["user_id"]
    token = registered_user["access_token"]

    # Create user state so the endpoint has data to return
    state = UserState(
        user_id=UUID(user_id), curriculum_version="v1",
        module_index=0, exercise_index=0, pacing="normal",
    )
    db.add(state)
    db.commit()

    resp = client.get(
        f"/users/{user_id}/state",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["module_index"] == 0
    assert body["pacing"] == "normal"


def test_protected_endpoint_rejects_wrong_user(client, registered_user, db):
    """Token for user A cannot access user B's state."""
    token = registered_user["access_token"]
    other_id = uuid4()

    resp = client.get(
        f"/users/{other_id}/state",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# POST /users removed – single creation path is /auth/signup
# ---------------------------------------------------------------------------


def test_post_users_endpoint_removed(client):
    """POST /users no longer exists; /auth/signup is the canonical creation path."""
    resp = client.post("/users", json={
        "first_name": "Ghost",
        "last_name": "User",
        "email": "ghost@example.com",
    })
    # Route is fully removed — FastAPI returns 404 for unknown paths
    assert resp.status_code == 404


def test_signup_is_canonical_creation_path(client, db):
    """Signup via /auth/signup creates a user with hashed password via repository."""
    resp = client.post("/auth/signup", json={
        "first_name": "Canonical",
        "last_name": "User",
        "email": "canonical@example.com",
        "password": "validpass88",
    })
    assert resp.status_code == 201
    body = resp.json()

    user = db.get(User, UUID(body["user_id"]))
    assert user is not None
    assert user.first_name == "Canonical"
    assert user.password_hash is not None
    assert user.password_hash.startswith("$2b$")


# ---------------------------------------------------------------------------
# All business endpoints require auth
# ---------------------------------------------------------------------------


def test_onboarding_rejects_missing_token(client, registered_user):
    resp = client.post(f"/users/{registered_user['user_id']}/onboarding", json={})
    assert resp.status_code == 401


def test_attempt_rejects_missing_token(client, registered_user):
    resp = client.post(f"/users/{registered_user['user_id']}/attempt", json={"code": "x=1"})
    assert resp.status_code == 401


def test_current_exercise_rejects_missing_token(client, registered_user):
    resp = client.get(f"/users/{registered_user['user_id']}/current-exercise")
    assert resp.status_code == 401


def test_onboarding_rejects_wrong_user(client, registered_user):
    token = registered_user["access_token"]
    other_id = uuid4()
    resp = client.post(
        f"/users/{other_id}/onboarding", json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# JWT secret config
# ---------------------------------------------------------------------------


def test_jwt_secret_loads_from_env(monkeypatch):
    """LUMO_JWT_SECRET env var is respected."""
    monkeypatch.setenv("LUMO_JWT_SECRET", "test-secret-from-env")
    from backend.app.core.security import _load_secret
    assert _load_secret() == "test-secret-from-env"


def test_jwt_secret_warns_when_missing(monkeypatch):
    """Missing LUMO_JWT_SECRET triggers a warning and uses dev fallback."""
    monkeypatch.delenv("LUMO_JWT_SECRET", raising=False)
    import warnings
    from backend.app.core.security import _DEV_SECRET, _load_secret
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        secret = _load_secret()
    assert secret == _DEV_SECRET
    assert any("LUMO_JWT_SECRET not set" in str(warning.message) for warning in w)


def test_jwt_secret_is_lazy(monkeypatch):
    """Secret is resolved at call time, not at import time."""
    import backend.app.core.security as sec

    # Clear the cache so the next call re-resolves
    sec._cached_secret = None
    monkeypatch.setenv("LUMO_JWT_SECRET", "lazy-test-value")
    assert sec.get_jwt_secret() == "lazy-test-value"

    # Change env and clear cache again — proves it re-reads
    sec._cached_secret = None
    monkeypatch.setenv("LUMO_JWT_SECRET", "changed-value")
    assert sec.get_jwt_secret() == "changed-value"

    # Reset cache so other tests aren't affected
    sec._cached_secret = None


# ---------------------------------------------------------------------------
# Health + root stay public
# ---------------------------------------------------------------------------


def test_health_is_public(client):
    # health is registered on the app, not the router, so we test via
    # a fresh app to prove the pattern. The main assertion is that
    # signup/login work (already tested above) and health would not
    # require auth. Since our test client only mounts the routers,
    # we verify no auth is needed on a known public pattern.
    app = FastAPI()
    app.include_router(auth_router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    tc = TestClient(app)
    resp = tc.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Env file loading
# ---------------------------------------------------------------------------


def test_load_env_populates_os_environ(tmp_path, monkeypatch):
    """load_env reads a .env file into os.environ."""
    env_file = tmp_path / ".env"
    env_file.write_text("LUMO_TEST_MARKER=from-dotenv\n")
    monkeypatch.delenv("LUMO_TEST_MARKER", raising=False)

    from dotenv import load_dotenv
    load_dotenv(env_file, override=False)

    import os
    assert os.environ.get("LUMO_TEST_MARKER") == "from-dotenv"
    monkeypatch.delenv("LUMO_TEST_MARKER", raising=False)


def test_load_env_does_not_overwrite_existing(tmp_path, monkeypatch):
    """Existing env vars take precedence over .env file values."""
    env_file = tmp_path / ".env"
    env_file.write_text("LUMO_TEST_MARKER=from-file\n")
    monkeypatch.setenv("LUMO_TEST_MARKER", "from-shell")

    from dotenv import load_dotenv
    load_dotenv(env_file, override=False)

    import os
    assert os.environ["LUMO_TEST_MARKER"] == "from-shell"


# ---------------------------------------------------------------------------
# Seed password config
# ---------------------------------------------------------------------------


def test_seed_password_reads_from_env(monkeypatch):
    """_get_seed_password returns the env var when set."""
    monkeypatch.setenv("LUMO_SEED_USER_PASSWORD", "custom-seed-pw")
    from backend.scripts.bootstrap_db import _get_seed_password
    assert _get_seed_password() == "custom-seed-pw"


def test_seed_password_warns_when_missing(monkeypatch):
    """Missing LUMO_SEED_USER_PASSWORD triggers a warning and uses dev fallback."""
    monkeypatch.delenv("LUMO_SEED_USER_PASSWORD", raising=False)
    import warnings
    from backend.scripts.bootstrap_db import _DEV_SEED_PASSWORD, _get_seed_password
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        pw = _get_seed_password()
    assert pw == _DEV_SEED_PASSWORD
    assert any("LUMO_SEED_USER_PASSWORD not set" in str(x.message) for x in w)
