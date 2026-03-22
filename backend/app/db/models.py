"""
Database table definitions for Lumo.

Contains SQLModel table classes for:
- User: Identity only (no learning logic)
- UserState: Current learning position
- UserProfileRecord: Persisted learning profile from onboarding
- ExerciseInstance: Snapshot of delivered exercise
- Attempt: Immutable record of user attempt
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    """
    User identity table.

    Stores basic user information only.
    Learning logic is handled by core agents, NOT here.
    """

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: Optional[str] = Field(default=None, max_length=255)
    profile_image_url: Optional[str] = Field(default=None, max_length=500)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    state: Optional["UserState"] = Relationship(back_populates="user")
    profile_record: Optional["UserProfileRecord"] = Relationship(back_populates="user")
    exercise_instances: list["ExerciseInstance"] = Relationship(back_populates="user")
    attempts: list["Attempt"] = Relationship(back_populates="user")


class UserState(SQLModel, table=True):
    """
    Current learning position for a user.

    Tracks where the user is in the curriculum.
    Updated as user progresses through exercises.
    """

    __tablename__ = "user_states"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    curriculum_version: str = Field(max_length=50)
    module_index: int = Field(ge=0)
    exercise_index: int = Field(ge=0)
    pacing: str = Field(max_length=20, default="normal")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="state")


class UserProfileRecord(SQLModel, table=True):
    """
    Persisted learning profile from onboarding.

    Stores the real UserProfile produced by UserProfilerAgent so
    downstream flows (MentorAgent, etc.) use accurate profile data
    instead of reconstructing a degraded version from UserState.
    """

    __tablename__ = "user_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    skill_level: str = Field(max_length=30)
    confidence_score: float
    learning_style: str = Field(max_length=30)
    initial_track: str = Field(max_length=100)
    preferred_languages_json: str = Field(default="[\"en\"]")
    raw_input_json: str = Field(default="{}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="profile_record")


class ExerciseInstance(SQLModel, table=True):
    """
    Snapshot of an exercise delivered to a user.

    Immutable record of what was shown to the user.
    Allows historical analysis even if curriculum changes.
    """

    __tablename__ = "exercise_instances"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    curriculum_version: str = Field(max_length=50)
    module_index: int = Field(ge=0)
    exercise_index: int = Field(ge=0)
    prompt_text: str
    metadata_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="exercise_instances")
    attempts: list["Attempt"] = Relationship(back_populates="exercise_instance")


class Attempt(SQLModel, table=True):
    """
    Immutable record of a user attempt.

    Stores the code submitted and the feedback received.
    Never modified after creation.
    """

    __tablename__ = "attempts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    exercise_instance_id: UUID = Field(foreign_key="exercise_instances.id", index=True)
    code: str
    diagnostics_json: Optional[str] = Field(default=None)
    mentor_response_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship(back_populates="attempts")
    exercise_instance: Optional[ExerciseInstance] = Relationship(
        back_populates="attempts"
    )
