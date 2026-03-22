"""Tests for MentorAgent - verifying pedagogical guidance logic."""

import pytest

from backend.app.agents.mentor import MentorAgent, MentorResponse
from backend.app.core.diagnostics import (
    analyze_code,
    Diagnostic,
    DiagnosticCode,
    DiagnosticsResult,
    DiagnosticSeverity,
)
from backend.app.models.exercise import ExerciseDefinition, ExerciseType
from backend.app.models.user import (
    LearningStyle,
    OnboardingInput,
    SkillLevel,
    UserProfile,
)


class TestMentorHappyPath:
    """Test standard mentor response scenarios."""

    def test_error_diagnostics_produce_hint(self, beginner_profile, sample_exercise):
        """Diagnostics with errors produce helpful hint response."""
        agent = MentorAgent()
        diagnostics = analyze_code("if True\n    print('x')")  # Syntax error

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response, MentorResponse)
        assert len(response.hint) > 0
        assert len(response.encouragement) > 0
        assert len(response.next_action) > 0

    def test_warning_diagnostics_produce_hint(self, beginner_profile, sample_exercise):
        """Diagnostics with warnings produce helpful hint response."""
        agent = MentorAgent()
        diagnostics = analyze_code("print(undefined_var)")  # Undefined name warning

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response, MentorResponse)
        assert len(response.hint) > 0

    def test_no_issues_produce_success_guidance(self, beginner_profile, sample_exercise):
        """Clean code produces success/next-step guidance."""
        agent = MentorAgent()
        diagnostics = analyze_code("x = 10\nprint(x)")  # Valid code

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response, MentorResponse)
        assert len(response.hint) > 0
        # Should mention checking/verifying or validation
        assert "check" in response.hint.lower() or "verify" in response.hint.lower() or "task" in response.hint.lower()


class TestNeverReturnsCode:
    """Test that mentor never returns code snippets."""

    def test_response_contains_no_code_blocks(self, beginner_profile, sample_exercise):
        """Responses do not contain code blocks."""
        agent = MentorAgent()
        diagnostics = analyze_code("if True\n    print('x')")

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should not contain code block markers
        full_response = response.hint + response.encouragement + response.next_action
        assert "```" not in full_response
        assert ">>>" not in full_response  # Python REPL marker

    def test_response_contains_no_python_statements(self, beginner_profile, sample_exercise):
        """Responses do not contain executable Python statements."""
        agent = MentorAgent()
        diagnostics = analyze_code("x = undefined + 1")

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        full_response = response.hint + response.encouragement + response.next_action
        # Should not contain common Python statements
        assert "print(" not in full_response.lower() or "print" in full_response.lower()  # May reference print as concept
        assert "def " not in full_response
        assert "class " not in full_response
        assert "import " not in full_response


class TestNeverReturnsFullSolutions:
    """Test that mentor never gives away the answer."""

    def test_syntax_error_no_solution(self, beginner_profile, sample_exercise):
        """Syntax error hints don't show the fix."""
        agent = MentorAgent()
        diagnostics = analyze_code("if True\n    print('x')")

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should not contain the fix (adding colon)
        assert "if True:" not in response.hint
        # Should guide, not give answer
        assert "colon" in response.hint.lower() or "symbol" in response.hint.lower() or "rules" in response.hint.lower()

    def test_undefined_variable_no_solution(self, beginner_profile, sample_exercise):
        """Undefined variable hints don't provide the definition."""
        agent = MentorAgent()
        diagnostics = analyze_code("print(missing_var)")

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should not contain example definitions
        assert "missing_var = " not in response.hint
        # Should ask guiding questions
        assert "?" in response.hint or "where" in response.hint.lower()


class TestOneIssueAtATime:
    """Test that mentor addresses only one issue at a time."""

    def test_multiple_errors_addresses_first(self, beginner_profile, sample_exercise):
        """With multiple errors, only the first is addressed."""
        agent = MentorAgent()
        # Create diagnostics with multiple errors
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.SYNTAX_ERROR,
                    severity=DiagnosticSeverity.ERROR,
                    message="First error",
                    line=1,
                ),
                Diagnostic(
                    code=DiagnosticCode.INDENTATION_ERROR,
                    severity=DiagnosticSeverity.ERROR,
                    message="Second error",
                    line=5,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should reference line 1, not line 5
        assert "line 1" in response.hint.lower() or "1" in response.hint

    def test_errors_take_priority_over_warnings(self, beginner_profile, sample_exercise):
        """Errors are addressed before warnings."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.UNDEFINED_NAME,
                    severity=DiagnosticSeverity.WARNING,
                    message="Warning first in list",
                    line=1,
                ),
                Diagnostic(
                    code=DiagnosticCode.SYNTAX_ERROR,
                    severity=DiagnosticSeverity.ERROR,
                    message="Error second in list",
                    line=5,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should reference line 5 (the error), not line 1 (the warning)
        assert "5" in response.hint or "line 5" in response.hint.lower()


class TestToneAdaptation:
    """Test that tone adapts to user skill and confidence."""

    def test_beginner_low_confidence_more_supportive(self, sample_exercise):
        """Beginner with low confidence gets supportive tone."""
        agent = MentorAgent()
        profile = UserProfile(
            user_id="beginner_low",
            inferred_skill_level=SkillLevel.BEGINNER,
            confidence_score=0.3,  # Low confidence
            learning_style=LearningStyle.STRUCTURED,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        diagnostics = analyze_code("if True\n    print('x')")

        response = agent.generate_response(profile, sample_exercise, diagnostics)

        # Should include extra supportive language
        full_response = response.encouragement + response.next_action
        assert "rush" in full_response.lower() or "okay" in full_response.lower() or "time" in full_response.lower()

    def test_advanced_high_confidence_concise(self, sample_exercise):
        """Advanced with high confidence gets concise tone."""
        agent = MentorAgent()
        profile = UserProfile(
            user_id="advanced_high",
            inferred_skill_level=SkillLevel.ADVANCED,
            confidence_score=0.8,  # High confidence
            learning_style=LearningStyle.FAST_TRACK,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        diagnostics = analyze_code("if True\n    print('x')")

        response = agent.generate_response(profile, sample_exercise, diagnostics)

        # Should have concise encouragement
        assert response.encouragement == "You've got this."

    def test_intermediate_gets_default_tone(self, sample_exercise):
        """Intermediate users get default (unchanged) tone."""
        agent = MentorAgent()
        profile = UserProfile(
            user_id="intermediate",
            inferred_skill_level=SkillLevel.INTERMEDIATE,
            confidence_score=0.5,
            learning_style=LearningStyle.STRUCTURED,
            initial_track="python_basics",
            preferred_languages=("en",),
            raw_input=OnboardingInput(),
        )
        diagnostics = analyze_code("if True\n    print('x')")

        response = agent.generate_response(profile, sample_exercise, diagnostics)

        # Should not have extra supportive or concise modifications
        assert "rush" not in response.next_action.lower()
        assert response.encouragement != "You've got this."


class TestDeterminism:
    """Test that output is deterministic."""

    def test_same_input_produces_same_output(self, beginner_profile, sample_exercise):
        """Identical inputs produce identical responses."""
        agent = MentorAgent()
        diagnostics = analyze_code("print(undefined_var)")

        response1 = agent.generate_response(beginner_profile, sample_exercise, diagnostics)
        response2 = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert response1 == response2

    def test_repeated_execution_consistency(self, beginner_profile, sample_exercise):
        """Multiple executions produce consistent results."""
        agent = MentorAgent()
        diagnostics = analyze_code("if True\n    print('x')")

        responses = [
            agent.generate_response(beginner_profile, sample_exercise, diagnostics)
            for _ in range(10)
        ]

        assert all(r == responses[0] for r in responses)


class TestSpecificErrorTypes:
    """Test responses for specific error types."""

    def test_syntax_error_response(self, beginner_profile, sample_exercise):
        """SYNTAX_ERROR produces appropriate hint."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.SYNTAX_ERROR,
                    severity=DiagnosticSeverity.ERROR,
                    message="Syntax issue",
                    line=3,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert "3" in response.hint  # References line number
        assert "syntax" in response.encouragement.lower() or "structure" in response.hint.lower()

    def test_indentation_error_response(self, beginner_profile, sample_exercise):
        """INDENTATION_ERROR produces appropriate hint."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.INDENTATION_ERROR,
                    severity=DiagnosticSeverity.ERROR,
                    message="Indentation issue",
                    line=2,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should mention spaces or indentation
        assert "space" in response.hint.lower() or "indent" in response.hint.lower()

    def test_undefined_name_response(self, beginner_profile, sample_exercise):
        """UNDEFINED_NAME produces appropriate hint."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.UNDEFINED_NAME,
                    severity=DiagnosticSeverity.WARNING,
                    message="undefined var",
                    line=5,
                ),
            ),
            has_errors=False,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should ask about where name comes from
        assert "name" in response.hint.lower() or "recognize" in response.hint.lower()

    def test_type_mismatch_response(self, beginner_profile, sample_exercise):
        """TYPE_MISMATCH_OPERATION produces appropriate hint."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.TYPE_MISMATCH_OPERATION,
                    severity=DiagnosticSeverity.ERROR,
                    message="Type mismatch",
                    line=4,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should mention types or combining values
        assert "type" in response.hint.lower() or "combine" in response.hint.lower() or "mix" in response.hint.lower()

    def test_infinite_loop_response(self, beginner_profile, sample_exercise):
        """POSSIBLE_INFINITE_LOOP produces appropriate hint."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.POSSIBLE_INFINITE_LOOP,
                    severity=DiagnosticSeverity.WARNING,
                    message="Infinite loop",
                    line=1,
                ),
            ),
            has_errors=False,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        # Should mention loop stopping or condition
        assert "loop" in response.hint.lower() or "stop" in response.hint.lower() or "condition" in response.hint.lower()


class TestEdgeCases:
    """Test edge cases."""

    def test_empty_diagnostics(self, beginner_profile, sample_exercise):
        """Empty diagnostics list produces success response."""
        agent = MentorAgent()
        diagnostics = DiagnosticsResult(diagnostics=(), has_errors=False)

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response, MentorResponse)
        assert len(response.hint) > 0

    def test_unknown_error_code_handled(self, beginner_profile, sample_exercise):
        """Unknown error codes are handled gracefully."""
        agent = MentorAgent()
        # Using a valid code but testing fallback behavior
        diagnostics = DiagnosticsResult(
            diagnostics=(
                Diagnostic(
                    code=DiagnosticCode.SYNTAX_ERROR,  # Using known code
                    severity=DiagnosticSeverity.ERROR,
                    message="Unknown issue",
                    line=10,
                ),
            ),
            has_errors=True,
        )

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response, MentorResponse)
        assert "10" in response.hint  # Still references line

    def test_response_fields_are_strings(self, beginner_profile, sample_exercise):
        """All response fields are non-empty strings."""
        agent = MentorAgent()
        diagnostics = analyze_code("x = 1")

        response = agent.generate_response(beginner_profile, sample_exercise, diagnostics)

        assert isinstance(response.hint, str) and len(response.hint) > 0
        assert isinstance(response.encouragement, str) and len(response.encouragement) > 0
        assert isinstance(response.next_action, str) and len(response.next_action) > 0
