"""
Database session and engine configuration for Lumo.

Provides SQLite engine setup and session management.
Designed for easy transition to PostgreSQL in production.
"""

import os
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from backend.app.observability.logging_config import get_logger

_log = get_logger("db.session")

# Database path: honour LUMO_DB_PATH env var (set in Docker), else default to project-root lumo.db
_env_db_path = os.environ.get("LUMO_DB_PATH")
DEFAULT_DB_PATH = Path(_env_db_path) if _env_db_path else Path(__file__).parent.parent.parent.parent / "lumo.db"
DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH}"

# Engine configuration
# check_same_thread=False required for SQLite with FastAPI
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
_log.debug("Engine created", extra={"stage": "db_init"})


def init_db() -> None:
    """
    Initialize the database by creating all tables.

    Call this once at application startup.
    """
    _log.info("Initializing database tables", extra={"stage": "db_init"})
    SQLModel.metadata.create_all(engine)
    _log.info("Database tables created", extra={"stage": "db_init"})


def get_session() -> Generator[Session, None, None]:
    """
    Provide a database session for dependency injection.

    Usage:
        with next(get_session()) as session:
            # use session
    """
    _log.debug("Opening database session", extra={"stage": "db_session"})
    with Session(engine) as session:
        yield session
    _log.debug("Database session closed", extra={"stage": "db_session"})


def get_engine_for_testing(db_url: str = "sqlite:///:memory:"):
    """
    Create an in-memory engine for testing purposes.

    Args:
        db_url: Database URL (defaults to in-memory SQLite)

    Returns:
        SQLModel engine configured for testing
    """
    _log.debug("Creating test engine", extra={"stage": "db_test"})
    return create_engine(
        db_url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
