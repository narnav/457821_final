"""
MentorAgent for Lumo - deterministic MVP without LLM.

Provides pedagogical guidance based on diagnostics, user profile, and exercise context.
Never gives direct solutions; guides attention and encourages reflection.
"""

from typing import Optional

from pydantic import BaseModel

from backend.app.core.diagnostics import (
    DiagnosticCode,
    DiagnosticSeverity,
    DiagnosticsResult,
)
from backend.app.core.hint_policy import GuidanceTemplate, adapt_guidance_for_tone
from backend.app.models.exercise import ExerciseDefinition
from backend.app.models.user import UserProfile
from backend.app.observability.logging_config import get_logger, safe_user_ref

_log = get_logger("agent.mentor")


class MentorResponse(BaseModel):
    """Response from the MentorAgent."""

    model_config = {"frozen": True}

    hint: str
    encouragement: str
    next_action: str


_ERROR_TEMPLATES: dict[DiagnosticCode, GuidanceTemplate] = {
    DiagnosticCode.SYNTAX_ERROR: GuidanceTemplate(
        hint="Look carefully at line {line}. Python has specific rules about how code must be written. Check for missing or extra symbols like colons, parentheses, or quotes.",
        encouragement="Syntax issues are common and get easier to spot with practice.",
        next_action="Read the line character by character and compare it to similar working code.",
    ),
    DiagnosticCode.INDENTATION_ERROR: GuidanceTemplate(
        hint="Python uses spaces at the start of lines to understand code structure. Check line {line} and the lines around it. Are they aligned correctly?",
        encouragement="Indentation can be tricky at first, but it becomes second nature.",
        next_action="Count the spaces at the start of each line in this block. They should follow a consistent pattern.",
    ),
    DiagnosticCode.TYPE_MISMATCH_OPERATION: GuidanceTemplate(
        hint="On line {line}, you're trying to combine values that don't mix directly. Think about what types of data you're working with there.",
        encouragement="Understanding data types is a key skill you're building.",
        next_action="Identify what kind of value is on each side of the operation. Are they compatible?",
    ),
}

_WARNING_TEMPLATES: dict[DiagnosticCode, GuidanceTemplate] = {
    DiagnosticCode.UNDEFINED_NAME: GuidanceTemplate(
        hint="Near line {line}, you're using a name that Python might not recognize yet. Where does this name come from?",
        encouragement="Tracking where names come from is an important debugging skill.",
        next_action="Trace back: where is this name first given a value? Is that line executed before this one?",
    ),
    DiagnosticCode.POSSIBLE_INFINITE_LOOP: GuidanceTemplate(
        hint="The loop starting at line {line} might not stop on its own. What needs to change for the condition to eventually become false?",
        encouragement="Thinking about loop termination shows good algorithmic thinking.",
        next_action="Walk through the loop mentally: what changes each time? Does it get closer to ending?",
    ),
}

_NO_ISSUES_GUIDANCE = GuidanceTemplate(
    hint="Your code passes the basic checks. Now verify it does what the task asks.",
    encouragement="Good progress! The code structure looks solid.",
    next_action="Re-read the task requirements and trace through your code with a sample input.",
)


def _format_template(template: GuidanceTemplate, line: int) -> GuidanceTemplate:
    """Replace {line} placeholder in template strings."""
    return GuidanceTemplate(
        hint=template.hint.format(line=line),
        encouragement=template.encouragement.format(line=line),
        next_action=template.next_action.format(line=line),
    )


class MentorAgent:
    """
    Deterministic mentor that provides pedagogical guidance.

    Rules:
    - If diagnostics has any ERROR: use first error, return category-specific hint
    - If only WARNINGS: return guiding question for top warning
    - If no diagnostics: encourage and suggest next action

    Never provides code snippets or direct solutions.
    """

    def generate_response(
        self,
        user_profile: UserProfile,
        exercise: ExerciseDefinition,
        diagnostics: DiagnosticsResult,
        trace_id: Optional[str] = None,
    ) -> MentorResponse:
        """Generate mentor guidance based on diagnostics and user context."""
        _log.info(
            "MentorAgent.generate_response START exercise=%s has_errors=%s diag_count=%d",
            exercise.exercise_id, diagnostics.has_errors, len(diagnostics.diagnostics),
            extra={"stage": "agent", "user_ref": safe_user_ref(user_profile.user_id), "trace_id": trace_id},
        )
        skill_level = user_profile.inferred_skill_level
        confidence = user_profile.confidence_score

        first_error = self._find_first_by_severity(diagnostics, DiagnosticSeverity.ERROR)
        first_warning = self._find_first_by_severity(diagnostics, DiagnosticSeverity.WARNING)

        if first_error is not None:
            category = "error"
            diag_code = first_error.code.value
            template = _ERROR_TEMPLATES.get(
                first_error.code,
                GuidanceTemplate(
                    hint=f"There's an issue on line {first_error.line}. Look carefully at that area.",
                    encouragement="Debugging is a skill that improves with practice.",
                    next_action="Focus on line {line} and check for common mistakes.",
                ),
            )
            template = _format_template(template, first_error.line)
            template = adapt_guidance_for_tone(template, skill_level, confidence)

        elif first_warning is not None:
            category = "warning"
            diag_code = first_warning.code.value
            template = _WARNING_TEMPLATES.get(
                first_warning.code,
                GuidanceTemplate(
                    hint=f"Something near line {first_warning.line} might not work as expected.",
                    encouragement="Catching potential issues early is great practice.",
                    next_action="Think through what happens when line {line} runs.",
                ),
            )
            template = _format_template(template, first_warning.line)
            template = adapt_guidance_for_tone(template, skill_level, confidence)

        else:
            category = "clean"
            diag_code = None
            template = adapt_guidance_for_tone(_NO_ISSUES_GUIDANCE, skill_level, confidence)

        tone = "supportive" if skill_level.value == "beginner" and confidence < 0.5 else (
            "concise" if skill_level.value == "advanced" and confidence >= 0.7 else "default"
        )
        _log.info(
            "MentorAgent.generate_response END category=%s diag_code=%s tone=%s",
            category, diag_code, tone,
            extra={"stage": "agent", "user_ref": safe_user_ref(user_profile.user_id), "trace_id": trace_id},
        )

        return MentorResponse(
            hint=template.hint,
            encouragement=template.encouragement,
            next_action=template.next_action,
        )

    def _find_first_by_severity(
        self,
        diagnostics: DiagnosticsResult,
        severity: DiagnosticSeverity,
    ) -> Optional[object]:
        """Find the first diagnostic with the given severity."""
        for diag in diagnostics.diagnostics:
            if diag.severity == severity:
                return diag
        return None
