"""
Curriculum Agent for Lumo.

Creates personalized learning plans based on user profiles.
Decides WHAT the user learns and at what PACE.

Design:
- Data-driven: modules provided as input, not hardcoded
- Deterministic: same profile + modules → same plan
- Conservative: when uncertain, include more modules
"""

from typing import Optional

from backend.app.models.curriculum import CurriculumPlan, ModuleInfo, Pacing
from backend.app.models.user import LearningStyle, SkillLevel, UserProfile
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("agent.curriculum")


class CurriculumAgent:
    """
    Creates personalized curriculum plans.

    Module selection rules:
    - BEGINNER/INTERMEDIATE: All modules (diagnostics will accelerate)
    - ADVANCED with high confidence: May skip modules marked skippable

    Pacing rules:
    - STRUCTURED/EXPLORATORY → NORMAL pacing
    - FAST_TRACK → FAST pacing
    """

    SKIP_CONFIDENCE_THRESHOLD: float = 0.6
    SKIPPABLE_FOR_ADVANCED: frozenset[str] = frozenset({"module_3", "module_4"})

    def plan(
        self,
        profile: UserProfile,
        modules: tuple[ModuleInfo, ...],
        track_id: str,
        trace_id: Optional[str] = None,
    ) -> CurriculumPlan:
        """
        Generate a curriculum plan.

        Args:
            profile: User profile from UserProfilerAgent.
            modules: Available modules for the track.
            track_id: Identifier for the curriculum track.
            trace_id: Optional correlation ID.

        Returns:
            Personalized CurriculumPlan.
        """
        _log.info(
            "CurriculumAgent.plan START track=%s modules_available=%d",
            track_id, len(modules),
            extra={"stage": "agent", "user_ref": safe_user_ref(profile.user_id), "trace_id": trace_id},
        )
        skip_modules = self._determine_skips(profile, modules)
        included_modules = self._filter_modules(modules, skip_modules)
        pacing = self._determine_pacing(profile)
        allow_exploration = profile.learning_style == LearningStyle.EXPLORATORY

        result = CurriculumPlan(
            user_id=profile.user_id,
            track_id=track_id,
            modules=included_modules,
            pacing=pacing,
            allow_exploration=allow_exploration,
            skip_modules=skip_modules,
        )
        _log.info(
            "CurriculumAgent.plan END modules_selected=%d skipped=%d pacing=%s",
            len(included_modules), len(skip_modules), pacing.value,
            extra={"stage": "agent", "user_ref": safe_user_ref(profile.user_id), "trace_id": trace_id},
        )
        return result

    def _determine_skips(
        self,
        profile: UserProfile,
        modules: tuple[ModuleInfo, ...],
    ) -> tuple[str, ...]:
        """Determine which modules to skip based on skill level."""
        if profile.inferred_skill_level != SkillLevel.ADVANCED:
            return ()

        if profile.confidence_score < self.SKIP_CONFIDENCE_THRESHOLD:
            return ()

        return tuple(
            m.module_id
            for m in modules
            if m.is_skippable and m.module_id in self.SKIPPABLE_FOR_ADVANCED
        )

    def _filter_modules(
        self,
        modules: tuple[ModuleInfo, ...],
        skip_ids: tuple[str, ...],
    ) -> tuple[ModuleInfo, ...]:
        """Remove skipped modules from sequence."""
        skip_set = set(skip_ids)
        return tuple(m for m in modules if m.module_id not in skip_set)

    def _determine_pacing(self, profile: UserProfile) -> Pacing:
        """Map learning style to pacing."""
        if profile.learning_style == LearningStyle.FAST_TRACK:
            return Pacing.FAST
        return Pacing.NORMAL
