"""API request/response schemas for Lumo."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- User ---
# Constraints mirror DB User model to surface violations as 422, not 500.

class CreateUserRequest(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default=None, max_length=50)
    profile_image_url: Optional[str] = Field(default=None, max_length=500)


class CreateUserResponse(BaseModel):
    id: UUID
    email: str


# --- Onboarding ---

class OnboardingRequest(BaseModel):
    # age is NOT here — collected once at POST /users (identity).
    # The route reads user.age from DB for profiler input.
    preferred_languages: list[str] = Field(default_factory=lambda: ["en"])
    prior_experience: Optional[str] = None
    learning_goals: list[str] = Field(default_factory=list)
    pace_preference: Optional[str] = None


class OnboardingResponse(BaseModel):
    user_id: UUID
    skill_level: str
    learning_style: str
    pacing: str
    message: str


# --- Attempt ---

class AttemptRequest(BaseModel):
    code: str


class DiagnosticSummary(BaseModel):
    error_count: int
    warning_count: int
    codes: list[str]


class MentorResponseSchema(BaseModel):
    hint: str
    encouragement: str
    next_action: str


class StateSnapshot(BaseModel):
    module_index: int
    exercise_index: int
    pacing: str


class CurrentExerciseResponse(BaseModel):
    exercise_prompt: str
    module_index: int
    exercise_index: int
    exercise_id: str
    exercise_type: str
    instructions: str
    starter_code: str
    answer_mode: str
    module_exercise_count: int


class AttemptResponse(BaseModel):
    exercise_prompt: str
    passed: bool
    diagnostics_summary: DiagnosticSummary
    mentor_response: MentorResponseSchema
    state: StateSnapshot
