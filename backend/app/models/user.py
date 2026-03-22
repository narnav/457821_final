"""
User-related models for Lumo.

Defines core data structures for user state throughout the learning system.
The UserProfile is the canonical output of the UserProfilerAgent.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class SkillLevel(str, Enum):
    """Inferred skill level. Conservative: default to BEGINNER when uncertain."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class LearningStyle(str, Enum):
    """
    Preferred learning approach.

    STRUCTURED: Step-by-step, guided progression.
    EXPLORATORY: Open-ended, discovery-based.
    FAST_TRACK: Accelerated pace, minimal repetition.
    """

    STRUCTURED = "structured"
    EXPLORATORY = "exploratory"
    FAST_TRACK = "fast_track"


class OnboardingInput(BaseModel):
    """Raw input collected during user onboarding."""

    model_config = {"frozen": True}

    age: Optional[int] = None
    preferred_languages: tuple[str, ...] = ("en",)
    prior_experience: Optional[str] = None
    learning_goals: tuple[str, ...] = ()
    pace_preference: Optional[str] = None


class UserProfile(BaseModel):
    """
    Normalized user profile produced by the UserProfilerAgent.

    Single source of truth for user capability and preferences.
    All other agents consume this profile to personalize behavior.
    """

    model_config = {"frozen": True}

    user_id: str
    inferred_skill_level: SkillLevel
    confidence_score: float
    learning_style: LearningStyle
    initial_track: str
    preferred_languages: tuple[str, ...]
    raw_input: OnboardingInput
