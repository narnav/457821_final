"""Shared fixtures for Lumo tests."""

import sys
from pathlib import Path

import pytest

# Add the project root to the Python path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)
from backend.app.models.curriculum import ModuleInfo, Pacing
from backend.app.models.exercise import ExerciseDefinition, ExerciseType


@pytest.fixture
def beginner_onboarding():
    """Standard beginner onboarding input."""
    return OnboardingInput(
        age=25,
        prior_experience="none",
        learning_goals=("learn python", "build projects"),
        pace_preference="normal",
    )


@pytest.fixture
def experienced_onboarding():
    """Experienced user onboarding input."""
    return OnboardingInput(
        age=30,
        prior_experience="experienced",
        learning_goals=("refresh skills",),
        pace_preference="fast",
    )


@pytest.fixture
def empty_onboarding():
    """Minimal onboarding input with all defaults."""
    return OnboardingInput()


@pytest.fixture
def beginner_profile():
    """Standard beginner user profile."""
    return UserProfile(
        user_id="user_test123",
        inferred_skill_level=SkillLevel.BEGINNER,
        confidence_score=0.4,
        learning_style=LearningStyle.STRUCTURED,
        initial_track="python_basics",
        preferred_languages=("en",),
        raw_input=OnboardingInput(prior_experience="none"),
    )


@pytest.fixture
def advanced_profile():
    """Advanced user profile with high confidence."""
    return UserProfile(
        user_id="user_adv456",
        inferred_skill_level=SkillLevel.ADVANCED,
        confidence_score=0.7,
        learning_style=LearningStyle.FAST_TRACK,
        initial_track="python_basics",
        preferred_languages=("en",),
        raw_input=OnboardingInput(prior_experience="experienced"),
    )


@pytest.fixture
def sample_modules():
    """Sample module list for curriculum testing."""
    return (
        ModuleInfo(module_id="module_1", name="Thinking Like a Programmer", order=1, is_skippable=False),
        ModuleInfo(module_id="module_2", name="Variables and Types", order=2, is_skippable=False),
        ModuleInfo(module_id="module_3", name="Control Flow", order=3, is_skippable=True),
        ModuleInfo(module_id="module_4", name="Functions", order=4, is_skippable=True),
        ModuleInfo(module_id="module_5", name="Data Structures", order=5, is_skippable=True),
    )


@pytest.fixture
def sample_exercises():
    """Sample exercise list for selection testing."""
    return [
        ExerciseDefinition(
            exercise_id=f"ex_{i}",
            name=f"Exercise {i}",
            module_id="module_1",
            exercise_type=ExerciseType.GUIDED_PRACTICE,
            skills=("basics",),
            order=i,
        )
        for i in range(1, 8)
    ]


@pytest.fixture
def sample_exercise():
    """Single exercise for mentor testing."""
    return ExerciseDefinition(
        exercise_id="ex_1",
        name="Hello World",
        module_id="module_1",
        exercise_type=ExerciseType.GUIDED_PRACTICE,
        skills=("print", "syntax"),
        order=1,
    )
