"""Tests for UserProfilerAgent - verifying deterministic user profiling logic."""

import pytest

from backend.app.agents.user_profiler import UserProfilerAgent
from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)


class TestUserProfilerHappyPath:
    """Test standard profiling scenarios."""

    def test_beginner_profiling(self, beginner_onboarding):
        """Reasonable beginner onboarding input produces valid UserProfile."""
        agent = UserProfilerAgent()
        profile = agent.profile(beginner_onboarding)

        assert isinstance(profile, UserProfile)
        assert profile.inferred_skill_level == SkillLevel.BEGINNER
        assert profile.initial_track == "python_basics"
        assert profile.preferred_languages == ("en",)
        assert profile.raw_input == beginner_onboarding

    def test_experienced_profiling(self, experienced_onboarding):
        """Experienced user onboarding produces ADVANCED skill level."""
        agent = UserProfilerAgent()
        profile = agent.profile(experienced_onboarding)

        assert profile.inferred_skill_level == SkillLevel.ADVANCED
        assert profile.learning_style == LearningStyle.FAST_TRACK

    def test_intermediate_profiling(self):
        """Some experience produces INTERMEDIATE skill level."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(prior_experience="some")
        profile = agent.profile(onboarding)

        assert profile.inferred_skill_level == SkillLevel.INTERMEDIATE


class TestUserProfilerEmptyInput:
    """Test behavior with empty or minimal input."""

    def test_empty_onboarding_defaults_to_beginner(self, empty_onboarding):
        """Empty onboarding input defaults to BEGINNER skill level."""
        agent = UserProfilerAgent()
        profile = agent.profile(empty_onboarding)

        assert profile.inferred_skill_level == SkillLevel.BEGINNER
        assert profile.learning_style == LearningStyle.STRUCTURED

    def test_none_prior_experience_defaults_to_beginner(self):
        """None prior_experience defaults to BEGINNER."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(prior_experience=None)
        profile = agent.profile(onboarding)

        assert profile.inferred_skill_level == SkillLevel.BEGINNER

    def test_empty_string_prior_experience(self):
        """Empty string prior_experience is treated as unknown (BEGINNER)."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(prior_experience="")
        profile = agent.profile(onboarding)

        assert profile.inferred_skill_level == SkillLevel.BEGINNER


class TestConfidenceScore:
    """Test that confidence_score is always valid."""

    def test_confidence_always_between_0_and_1(self, beginner_onboarding):
        """Confidence score is always within valid range."""
        agent = UserProfilerAgent()
        profile = agent.profile(beginner_onboarding)

        assert 0 <= profile.confidence_score <= 1

    def test_confidence_with_empty_input(self, empty_onboarding):
        """Confidence score is valid even with minimal input."""
        agent = UserProfilerAgent()
        profile = agent.profile(empty_onboarding)

        assert 0 <= profile.confidence_score <= 1

    def test_confidence_with_all_fields(self):
        """Full onboarding input produces higher confidence (within bounds)."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(
            age=30,
            prior_experience="none",
            learning_goals=("learn python",),
            pace_preference="normal",
        )
        profile = agent.profile(onboarding)

        assert 0 <= profile.confidence_score <= 1
        # With all fields filled, confidence should be higher than base
        assert profile.confidence_score > 0.3

    def test_confidence_never_exceeds_1(self):
        """Confidence cannot exceed 1 even with maximum bonuses."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(
            age=25,
            prior_experience="none",  # base 0.7
            learning_goals=("goal1", "goal2", "goal3"),  # +0.1
            pace_preference="fast",  # +0.05
            # +0.05 for age
        )
        profile = agent.profile(onboarding)

        assert profile.confidence_score <= 1.0


class TestLearningStyle:
    """Test that learning_style is always set correctly."""

    def test_learning_style_always_set(self, beginner_onboarding):
        """Learning style is always assigned."""
        agent = UserProfilerAgent()
        profile = agent.profile(beginner_onboarding)

        assert profile.learning_style is not None
        assert isinstance(profile.learning_style, LearningStyle)

    def test_fast_pace_produces_fast_track(self):
        """Fast pace preference produces FAST_TRACK style."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(pace_preference="fast")
        profile = agent.profile(onboarding)

        assert profile.learning_style == LearningStyle.FAST_TRACK

    def test_slow_pace_produces_structured(self):
        """Slow pace preference produces STRUCTURED style."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(pace_preference="slow")
        profile = agent.profile(onboarding)

        assert profile.learning_style == LearningStyle.STRUCTURED

    def test_exploratory_keywords_produce_exploratory(self):
        """Exploratory keywords in goals produce EXPLORATORY style."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(learning_goals=("experiment with code", "explore python"))
        profile = agent.profile(onboarding)

        assert profile.learning_style == LearningStyle.EXPLORATORY

    def test_exploratory_keywords_override_pace(self):
        """Exploratory keywords in goals take precedence over pace."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(
            pace_preference="slow",
            learning_goals=("tinker with ideas",),
        )
        profile = agent.profile(onboarding)

        assert profile.learning_style == LearningStyle.EXPLORATORY


class TestDeterminism:
    """Test that output is deterministic."""

    def test_same_input_produces_same_output(self, beginner_onboarding):
        """Identical inputs always produce identical profiles (except user_id)."""
        agent = UserProfilerAgent()
        user_id = "fixed_user_123"

        profile1 = agent.profile(beginner_onboarding, user_id=user_id)
        profile2 = agent.profile(beginner_onboarding, user_id=user_id)

        assert profile1 == profile2

    def test_repeated_execution_consistency(self):
        """Multiple executions with same input are consistent."""
        agent = UserProfilerAgent()
        user_id = "determinism_test"
        onboarding = OnboardingInput(
            age=28,
            prior_experience="some",
            learning_goals=("build web apps",),
            pace_preference="normal",
        )

        profiles = [agent.profile(onboarding, user_id=user_id) for _ in range(10)]

        # All profiles should be identical
        assert all(p == profiles[0] for p in profiles)

    def test_user_id_generated_when_not_provided(self, beginner_onboarding):
        """User ID is generated if not provided."""
        agent = UserProfilerAgent()
        profile = agent.profile(beginner_onboarding)

        assert profile.user_id is not None
        assert profile.user_id.startswith("user_")


class TestEdgeCases:
    """Test edge cases and unusual inputs."""

    def test_case_insensitive_prior_experience(self):
        """Prior experience matching is case-insensitive."""
        agent = UserProfilerAgent()

        for exp in ["NONE", "None", "SOME", "Some", "EXPERIENCED", "Experienced"]:
            onboarding = OnboardingInput(prior_experience=exp)
            profile = agent.profile(onboarding)
            assert profile.inferred_skill_level is not None

    def test_whitespace_in_prior_experience(self):
        """Whitespace in prior_experience is trimmed."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(prior_experience="  none  ")
        profile = agent.profile(onboarding)

        assert profile.inferred_skill_level == SkillLevel.BEGINNER

    def test_unknown_prior_experience_defaults_to_beginner(self):
        """Unknown prior_experience value defaults to BEGINNER."""
        agent = UserProfilerAgent()
        onboarding = OnboardingInput(prior_experience="expert_level_master")
        profile = agent.profile(onboarding)

        assert profile.inferred_skill_level == SkillLevel.BEGINNER

    def test_long_learning_goals(self):
        """Long learning goals strings are handled correctly."""
        agent = UserProfilerAgent()
        long_goal = "I want to learn programming " * 100
        onboarding = OnboardingInput(learning_goals=(long_goal,))
        profile = agent.profile(onboarding)

        assert profile.learning_style is not None

    def test_many_learning_goals(self):
        """Many learning goals are handled correctly."""
        agent = UserProfilerAgent()
        many_goals = tuple(f"goal_{i}" for i in range(100))
        onboarding = OnboardingInput(learning_goals=many_goals)
        profile = agent.profile(onboarding)

        assert profile.learning_style is not None
