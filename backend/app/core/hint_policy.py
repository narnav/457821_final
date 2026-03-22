"""
Hint Policy for Lumo.

Defines guidance templates and tone adaptation logic used by MentorAgent.
Keeps policy decisions separate from agent orchestration.
"""

from pydantic import BaseModel

from backend.app.models.user import SkillLevel


class GuidanceTemplate(BaseModel):
    """Template for mentor guidance."""

    model_config = {"frozen": True}

    hint: str
    encouragement: str
    next_action: str


def adapt_guidance_for_tone(
    template: GuidanceTemplate,
    skill_level: SkillLevel,
    confidence: float,
) -> GuidanceTemplate:
    """
    Adapt guidance template based on user skill level and confidence.

    Rules:
    - beginner + low confidence (<0.5): more supportive, slightly more explicit
    - advanced + high confidence (>=0.7): concise, neutral
    - otherwise: return template unchanged
    """
    is_supportive = skill_level == SkillLevel.BEGINNER and confidence < 0.5
    is_concise = skill_level == SkillLevel.ADVANCED and confidence >= 0.7

    if is_supportive:
        return GuidanceTemplate(
            hint=template.hint,
            encouragement=f"{template.encouragement} Take your time—there's no rush.",
            next_action=f"{template.next_action} If you're unsure, that's completely okay.",
        )
    elif is_concise:
        return GuidanceTemplate(
            hint=template.hint,
            encouragement="You've got this.",
            next_action=template.next_action,
        )

    return template
