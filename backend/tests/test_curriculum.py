"""Tests for CurriculumAgent - verifying curriculum planning logic."""

import pytest

from backend.app.agents.curriculum import CurriculumAgent
from backend.app.models.curriculum import CurriculumPlan, ModuleInfo, Pacing
from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)


class TestCurriculumHappyPath:
    """Test standard curriculum planning scenarios."""

    def test_valid_profile_produces_valid_plan(self, beginner_profile, sample_modules):
        """Valid UserProfile produces valid CurriculumPlan."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert isinstance(plan, CurriculumPlan)
        assert plan.user_id == beginner_profile.user_id
        assert plan.track_id == "python_basics"

    def test_beginner_gets_all_modules(self, beginner_profile, sample_modules):
        """Beginner users receive all modules."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert len(plan.modules) == len(sample_modules)
        assert plan.skip_modules == ()

    def test_advanced_with_high_confidence_skips_modules(self, advanced_profile, sample_modules):
        """Advanced users with high confidence can skip certain modules."""
        agent = CurriculumAgent()
        plan = agent.plan(advanced_profile, sample_modules, "python_basics")

        # module_3 and module_4 are skippable for advanced users
        assert "module_3" in plan.skip_modules or "module_4" in plan.skip_modules
        assert len(plan.modules) < len(sample_modules)


class TestCurriculumPlanHasModules:
    """Test that CurriculumPlan always contains at least one module."""

    def test_plan_contains_at_least_one_module(self, beginner_profile, sample_modules):
        """Plan always has at least one module."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert len(plan.modules) >= 1

    def test_advanced_user_still_has_modules(self, advanced_profile, sample_modules):
        """Even advanced users with skips have at least one module."""
        agent = CurriculumAgent()
        plan = agent.plan(advanced_profile, sample_modules, "python_basics")

        assert len(plan.modules) >= 1

    def test_single_module_input(self, beginner_profile):
        """Single module input still produces valid plan."""
        agent = CurriculumAgent()
        single_module = (
            ModuleInfo(module_id="module_1", name="Basics", order=1, is_skippable=False),
        )
        plan = agent.plan(beginner_profile, single_module, "python_basics")

        assert len(plan.modules) == 1


class TestModuleSkipping:
    """Test module skipping rules."""

    def test_beginner_never_skips(self, sample_modules):
        """Beginner users never skip modules."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="beginner_test",
            inferred_skill_level=SkillLevel.BEGINNER,
            confidence_score=0.9,  # High confidence but beginner
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        assert plan.skip_modules == ()
        assert len(plan.modules) == len(sample_modules)

    def test_intermediate_never_skips(self, sample_modules):
        """Intermediate users never skip modules."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="intermediate_test",
            inferred_skill_level=SkillLevel.INTERMEDIATE,
            confidence_score=0.9,
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        assert plan.skip_modules == ()

    def test_advanced_low_confidence_no_skips(self, sample_modules):
        """Advanced users with low confidence don't skip modules."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="advanced_low_conf",
            inferred_skill_level=SkillLevel.ADVANCED,
            confidence_score=0.5,  # Below threshold (0.6)
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        assert plan.skip_modules == ()

    def test_only_skippable_modules_can_be_skipped(self, sample_modules):
        """Non-skippable modules are never skipped."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="advanced_high_conf",
            inferred_skill_level=SkillLevel.ADVANCED,
            confidence_score=0.9,
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        # module_1 and module_2 are not skippable
        assert "module_1" not in plan.skip_modules
        assert "module_2" not in plan.skip_modules

    def test_first_two_modules_never_skipped(self, advanced_profile, sample_modules):
        """First two modules are never skipped regardless of user level."""
        agent = CurriculumAgent()
        plan = agent.plan(advanced_profile, sample_modules, "python_basics")

        module_ids = [m.module_id for m in plan.modules]
        assert "module_1" in module_ids
        assert "module_2" in module_ids


class TestPacing:
    """Test pacing determination."""

    def test_fast_track_produces_fast_pacing(self):
        """FAST_TRACK learning style produces FAST pacing."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="fast_user",
            inferred_skill_level=SkillLevel.BEGINNER,
            confidence_score=0.5,
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        modules = (ModuleInfo(module_id="m1", name="M1", order=1, is_skippable=False),)
        plan = agent.plan(profile, modules, "python_basics")

        assert plan.pacing == Pacing.FAST

    def test_structured_produces_normal_pacing(self, beginner_profile, sample_modules):
        """STRUCTURED learning style produces NORMAL pacing."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert plan.pacing == Pacing.NORMAL

    def test_exploratory_produces_normal_pacing(self, sample_modules):
        """EXPLORATORY learning style produces NORMAL pacing."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="explorer",
            inferred_skill_level=SkillLevel.BEGINNER,
            confidence_score=0.5,
            learning_style=LearningStyle.EXPLORATORY,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        assert plan.pacing == Pacing.NORMAL


class TestExploration:
    """Test exploration flag."""

    def test_exploratory_style_allows_exploration(self, sample_modules):
        """EXPLORATORY learning style sets allow_exploration to True."""
        agent = CurriculumAgent()
        profile = UserProfile(
            user_id="explorer",
            inferred_skill_level=SkillLevel.BEGINNER,
            confidence_score=0.5,
            learning_style=LearningStyle.EXPLORATORY,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, sample_modules, "python_basics")

        assert plan.allow_exploration is True

    def test_structured_style_disables_exploration(self, beginner_profile, sample_modules):
        """STRUCTURED learning style sets allow_exploration to False."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert plan.allow_exploration is False


class TestDeterminism:
    """Test that output is deterministic."""

    def test_same_input_produces_same_plan(self, beginner_profile, sample_modules):
        """Identical inputs always produce identical plans."""
        agent = CurriculumAgent()

        plan1 = agent.plan(beginner_profile, sample_modules, "python_basics")
        plan2 = agent.plan(beginner_profile, sample_modules, "python_basics")

        assert plan1 == plan2

    def test_repeated_execution_consistency(self, advanced_profile, sample_modules):
        """Multiple executions with same input are consistent."""
        agent = CurriculumAgent()

        plans = [agent.plan(advanced_profile, sample_modules, "python_basics") for _ in range(10)]

        # All plans should be identical
        assert all(p == plans[0] for p in plans)


class TestEdgeCases:
    """Test edge cases and unusual inputs."""

    def test_empty_modules_list(self, beginner_profile):
        """Empty modules list produces plan with no modules."""
        agent = CurriculumAgent()
        empty_modules = ()
        plan = agent.plan(beginner_profile, empty_modules, "python_basics")

        assert plan.modules == ()
        assert plan.skip_modules == ()

    def test_all_modules_skippable(self):
        """All skippable modules can be handled."""
        agent = CurriculumAgent()
        all_skippable = (
            ModuleInfo(module_id="module_3", name="M3", order=3, is_skippable=True),
            ModuleInfo(module_id="module_4", name="M4", order=4, is_skippable=True),
        )
        profile = UserProfile(
            user_id="advanced_high_conf",
            inferred_skill_level=SkillLevel.ADVANCED,
            confidence_score=0.9,
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        plan = agent.plan(profile, all_skippable, "python_basics")

        # Should skip both as they are in SKIPPABLE_FOR_ADVANCED
        assert len(plan.skip_modules) == 2

    def test_module_order_preserved(self, beginner_profile, sample_modules):
        """Module order is preserved in the plan."""
        agent = CurriculumAgent()
        plan = agent.plan(beginner_profile, sample_modules, "python_basics")

        orders = [m.order for m in plan.modules]
        assert orders == sorted(orders)
