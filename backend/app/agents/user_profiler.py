"""
User Profiler Agent for Lumo.

Transforms raw onboarding input into a normalized UserProfile.
Single source of truth for user capability assessment.

Design:
- Conservative: When uncertain, assume beginner.
- Deterministic: No LLM calls. Same input → same output.
"""

import uuid
from typing import Optional

from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("agent.user_profiler")


class UserProfilerAgent:
    """
    Transforms onboarding data into a structured UserProfile.

    Applies conservative heuristics: when data is missing or ambiguous,
    defaults to assumptions that minimize user frustration.
    """

    EXPERIENCE_TO_SKILL: dict[Optional[str], SkillLevel] = {
        None: SkillLevel.BEGINNER,
        "none": SkillLevel.BEGINNER,
        "some": SkillLevel.INTERMEDIATE,
        "experienced": SkillLevel.ADVANCED,
    }

    EXPERIENCE_CONFIDENCE: dict[Optional[str], float] = {
        None: 0.3,
        "none": 0.7,
        "some": 0.5,
        "experienced": 0.4,  # Users often overestimate
    }

    PACE_TO_STYLE: dict[Optional[str], LearningStyle] = {
        None: LearningStyle.STRUCTURED,
        "slow": LearningStyle.STRUCTURED,
        "normal": LearningStyle.STRUCTURED,
        "fast": LearningStyle.FAST_TRACK,
    }

    EXPLORATORY_KEYWORDS: frozenset[str] = frozenset({
        "experiment", "explore", "play", "try", "tinker", "discover",
    })

    DEFAULT_TRACK: str = "python_basics"

    def profile(
        self,
        onboarding: OnboardingInput,
        user_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> UserProfile:
        """Generate a UserProfile from onboarding input."""
        _log.info(
            "UserProfilerAgent.profile START",
            extra={"stage": "agent", "user_ref": safe_user_ref(user_id), "trace_id": trace_id},
        )
        result = UserProfile(
            user_id=user_id or self._generate_user_id(),
            inferred_skill_level=self._infer_skill_level(onboarding.prior_experience),
            confidence_score=self._calculate_confidence(onboarding),
            learning_style=self._infer_learning_style(onboarding),
            initial_track=self.DEFAULT_TRACK,
            preferred_languages=onboarding.preferred_languages,
            raw_input=onboarding,
        )
        _log.info(
            "UserProfilerAgent.profile END skill=%s confidence=%.2f style=%s",
            result.inferred_skill_level.value,
            result.confidence_score,
            result.learning_style.value,
            extra={"stage": "agent", "user_ref": safe_user_ref(result.user_id), "trace_id": trace_id},
        )
        return result

    def _generate_user_id(self) -> str:
        return f"user_{uuid.uuid4().hex[:12]}"

    def _infer_skill_level(self, prior_experience: Optional[str]) -> SkillLevel:
        normalized = prior_experience.lower().strip() if prior_experience else None
        return self.EXPERIENCE_TO_SKILL.get(normalized, SkillLevel.BEGINNER)

    def _calculate_confidence(self, onboarding: OnboardingInput) -> float:
        base = self.EXPERIENCE_CONFIDENCE.get(
            onboarding.prior_experience.lower().strip()
            if onboarding.prior_experience else None,
            0.3,
        )
        bonus = 0.0
        if onboarding.learning_goals:
            bonus += 0.1
        if onboarding.pace_preference:
            bonus += 0.05
        if onboarding.age is not None:
            bonus += 0.05
        return min(1.0, base + bonus)

    def _infer_learning_style(self, onboarding: OnboardingInput) -> LearningStyle:
        if onboarding.learning_goals:
            goals_text = " ".join(onboarding.learning_goals).lower()
            if any(kw in goals_text for kw in self.EXPLORATORY_KEYWORDS):
                return LearningStyle.EXPLORATORY

        normalized_pace = (
            onboarding.pace_preference.lower().strip()
            if onboarding.pace_preference else None
        )
        return self.PACE_TO_STYLE.get(normalized_pace, LearningStyle.STRUCTURED)
