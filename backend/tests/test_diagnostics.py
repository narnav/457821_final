"""Tests for Diagnostics Engine - verifying static code analysis logic."""

import pytest

from backend.app.core.diagnostics import (
    analyze_code,
    DiagnosticCode,
    DiagnosticSeverity,
    DiagnosticsResult,
)


class TestSyntaxErrorDetection:
    """Test detection of syntax errors."""

    def test_detects_missing_colon(self):
        """Detects missing colon in if statement."""
        code = "if True\n    print('hello')"
        result = analyze_code(code)

        assert result.has_errors is True
        assert len(result.diagnostics) == 1
        assert result.diagnostics[0].code == DiagnosticCode.SYNTAX_ERROR

    def test_detects_missing_parenthesis(self):
        """Detects missing closing parenthesis."""
        code = "print('hello'"
        result = analyze_code(code)

        assert result.has_errors is True
        assert result.diagnostics[0].code == DiagnosticCode.SYNTAX_ERROR

    def test_detects_invalid_syntax(self):
        """Detects completely invalid syntax."""
        code = "def :"
        result = analyze_code(code)

        assert result.has_errors is True
        assert result.diagnostics[0].code == DiagnosticCode.SYNTAX_ERROR

    def test_detects_unclosed_string(self):
        """Detects unclosed string literal."""
        code = "x = 'hello"
        result = analyze_code(code)

        assert result.has_errors is True
        assert result.diagnostics[0].code == DiagnosticCode.SYNTAX_ERROR

    def test_syntax_error_has_line_number(self):
        """Syntax error includes line number."""
        code = "x = 1\nif True\n    print(x)"
        result = analyze_code(code)

        assert result.diagnostics[0].line == 2


class TestIndentationErrorDetection:
    """Test detection of indentation errors."""

    def test_detects_unexpected_indent(self):
        """Detects unexpected indentation."""
        code = "    print('hello')"
        result = analyze_code(code)

        assert result.has_errors is True
        assert result.diagnostics[0].code == DiagnosticCode.INDENTATION_ERROR

    def test_detects_missing_indent(self):
        """Detects missing indentation after colon."""
        code = "if True:\nprint('hello')"
        result = analyze_code(code)

        assert result.has_errors is True
        assert result.diagnostics[0].code == DiagnosticCode.INDENTATION_ERROR

    def test_detects_inconsistent_indent(self):
        """Detects inconsistent indentation."""
        code = "if True:\n    print('a')\n  print('b')"
        result = analyze_code(code)

        assert result.has_errors is True

    def test_indentation_error_has_line_number(self):
        """Indentation error includes line number."""
        code = "if True:\nprint('oops')"
        result = analyze_code(code)

        assert result.diagnostics[0].line >= 1


class TestUndefinedVariableDetection:
    """Test detection of undefined variables."""

    def test_detects_undefined_variable(self):
        """Detects use of undefined variable."""
        code = "print(undefined_var)"
        result = analyze_code(code)

        assert len(result.diagnostics) >= 1
        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 1
        assert "undefined_var" in undefined_diags[0].message

    def test_does_not_flag_defined_variable(self):
        """Does not flag properly defined variables."""
        code = "x = 10\nprint(x)"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 0

    def test_does_not_flag_builtins(self):
        """Does not flag Python builtin functions."""
        code = "print(len([1, 2, 3]))\nprint(range(10))"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 0

    def test_detects_undefined_in_expression(self):
        """Detects undefined variable in expression."""
        code = "x = y + 1"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 1
        assert "y" in undefined_diags[0].message

    def test_undefined_is_warning_not_error(self):
        """Undefined variable is a WARNING, not ERROR."""
        code = "print(undefined_var)"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert undefined_diags[0].severity == DiagnosticSeverity.WARNING

    def test_recognizes_function_definitions(self):
        """Recognizes function names as defined."""
        code = "def greet():\n    pass\ngreet()"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 0

    def test_recognizes_for_loop_variable(self):
        """Recognizes for loop variable as defined."""
        code = "for i in range(10):\n    print(i)"
        result = analyze_code(code)

        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 0


class TestTypeMismatchDetection:
    """Test detection of type mismatch operations."""

    def test_detects_string_plus_int(self):
        """Detects string + integer operation."""
        code = "x = 'hello' + 5"
        result = analyze_code(code)

        type_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.TYPE_MISMATCH_OPERATION]
        assert len(type_diags) == 1
        assert type_diags[0].severity == DiagnosticSeverity.ERROR

    def test_detects_int_plus_string(self):
        """Detects integer + string operation."""
        code = "x = 10 + 'world'"
        result = analyze_code(code)

        type_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.TYPE_MISMATCH_OPERATION]
        assert len(type_diags) == 1

    def test_allows_string_concatenation(self):
        """Does not flag valid string concatenation."""
        code = "x = 'hello' + ' world'"
        result = analyze_code(code)

        type_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.TYPE_MISMATCH_OPERATION]
        assert len(type_diags) == 0

    def test_allows_numeric_addition(self):
        """Does not flag valid numeric addition."""
        code = "x = 10 + 5"
        result = analyze_code(code)

        type_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.TYPE_MISMATCH_OPERATION]
        assert len(type_diags) == 0

    def test_detects_variable_type_mismatch(self):
        """Detects type mismatch with variables."""
        code = "name = 'Alice'\nage = 30\nresult = name + age"
        result = analyze_code(code)

        type_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.TYPE_MISMATCH_OPERATION]
        assert len(type_diags) == 1


class TestInfiniteLoopDetection:
    """Test detection of potential infinite loops."""

    def test_detects_infinite_while_loop(self):
        """Detects while loop where condition variable is not modified."""
        code = "x = True\nwhile x:\n    print('loop')"
        result = analyze_code(code)

        loop_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.POSSIBLE_INFINITE_LOOP]
        assert len(loop_diags) == 1
        assert loop_diags[0].severity == DiagnosticSeverity.WARNING

    def test_no_false_positive_with_modification(self):
        """Does not flag loop where condition variable is modified."""
        code = "x = 5\nwhile x > 0:\n    x = x - 1"
        result = analyze_code(code)

        loop_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.POSSIBLE_INFINITE_LOOP]
        assert len(loop_diags) == 0

    def test_no_false_positive_with_break(self):
        """Does not flag loop with break statement."""
        code = "x = True\nwhile x:\n    print('loop')\n    break"
        result = analyze_code(code)

        loop_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.POSSIBLE_INFINITE_LOOP]
        assert len(loop_diags) == 0

    def test_allows_while_true_pattern(self):
        """Does not flag intentional while True pattern."""
        code = "while True:\n    print('server')\n    break"
        result = analyze_code(code)

        loop_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.POSSIBLE_INFINITE_LOOP]
        assert len(loop_diags) == 0


class TestEmptyCodeHandling:
    """Test handling of empty code input."""

    def test_handles_empty_string(self):
        """Empty string produces valid result with no diagnostics."""
        result = analyze_code("")

        assert isinstance(result, DiagnosticsResult)
        assert result.has_errors is False
        assert len(result.diagnostics) == 0

    def test_handles_whitespace_only(self):
        """Whitespace-only code produces valid result."""
        result = analyze_code("   \n\n\t  ")

        assert isinstance(result, DiagnosticsResult)
        assert result.has_errors is False

    def test_handles_comments_only(self):
        """Code with only comments produces valid result."""
        result = analyze_code("# This is a comment\n# Another comment")

        assert isinstance(result, DiagnosticsResult)
        assert result.has_errors is False


class TestNeverCrashes:
    """Test that the diagnostics engine never crashes."""

    def test_handles_unicode(self):
        """Handles Unicode characters in code."""
        code = "x = '你好世界'\nprint(x)"
        result = analyze_code(code)

        assert isinstance(result, DiagnosticsResult)

    def test_handles_emoji(self):
        """Handles emoji in strings."""
        code = "message = '🎉 Success!'\nprint(message)"
        result = analyze_code(code)

        assert isinstance(result, DiagnosticsResult)

    def test_handles_very_long_code(self):
        """Handles very long code strings."""
        code = "x = 1\n" * 1000
        result = analyze_code(code)

        assert isinstance(result, DiagnosticsResult)

    def test_handles_deeply_nested_code(self):
        """Handles deeply nested code structures."""
        code = "if True:\n" + "    " * 1 + "if True:\n" + "    " * 2 + "if True:\n" + "    " * 3 + "pass"
        result = analyze_code(code)

        assert isinstance(result, DiagnosticsResult)

    def test_handles_binary_garbage(self):
        """Handles non-code input gracefully."""
        code = "\x00\x01\x02\x03"
        result = analyze_code(code)

        assert isinstance(result, DiagnosticsResult)
        # Should likely produce a syntax error
        assert result.has_errors is True

    def test_always_returns_diagnostics_result(self):
        """Always returns a DiagnosticsResult object."""
        test_inputs = [
            "",
            "x = 1",
            "invalid (",
            "def foo(): pass",
            None,  # This may cause an error but should not crash
        ]

        for inp in test_inputs:
            if inp is None:
                # Expect this to fail gracefully or raise - test separately
                continue
            result = analyze_code(inp)
            assert isinstance(result, DiagnosticsResult)


class TestValidCodeAnalysis:
    """Test analysis of valid code."""

    def test_valid_code_has_no_errors(self):
        """Valid Python code produces no errors."""
        code = """
def greet(name):
    return f"Hello, {name}!"

result = greet("World")
print(result)
"""
        result = analyze_code(code)

        assert result.has_errors is False

    def test_valid_class_definition(self):
        """Valid class definition produces no errors."""
        code = """
class Calculator:
    def add(self, a, b):
        return a + b

    def subtract(self, a, b):
        return a - b
"""
        result = analyze_code(code)

        assert result.has_errors is False

    def test_valid_import_statements(self):
        """Valid import statements are handled."""
        code = "import os\nprint(os.getcwd())"
        result = analyze_code(code)

        # os should be recognized as defined via import
        undefined_diags = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined_diags) == 0


class TestDeterminism:
    """Test that output is deterministic."""

    def test_same_code_produces_same_result(self):
        """Identical code produces identical diagnostics."""
        code = "x = undefined_var + 1"

        result1 = analyze_code(code)
        result2 = analyze_code(code)

        assert result1 == result2

    def test_repeated_execution_consistency(self):
        """Multiple executions produce consistent results."""
        code = "if True\n    print('x')"

        results = [analyze_code(code) for _ in range(10)]

        assert all(r == results[0] for r in results)


class TestDiagnosticsSorting:
    """Test that diagnostics are sorted by line number."""

    def test_diagnostics_sorted_by_line(self):
        """Multiple diagnostics are sorted by line number."""
        code = """x = undefined1
y = undefined2
z = undefined3"""
        result = analyze_code(code)

        if len(result.diagnostics) > 1:
            lines = [d.line for d in result.diagnostics]
            assert lines == sorted(lines)


class TestScopeAwareness:
    """Test that function params and comprehension targets are not false positives."""

    def test_function_params_not_flagged(self):
        """Function parameter names should be recognized as defined."""
        code = "def f(x):\n    return x"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_args_kwargs_not_flagged(self):
        """*args and **kwargs should be recognized as defined."""
        code = "def f(*args, **kwargs):\n    return args, kwargs"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_comprehension_target_not_flagged(self):
        """List comprehension target should be recognized as defined."""
        code = "xs = [x for x in range(3)]"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_dict_comprehension_target_not_flagged(self):
        """Dict comprehension targets should be recognized as defined."""
        code = "d = {k: v for k, v in [(1, 2)]}"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_truly_undefined_still_flagged(self):
        """Truly undefined names must still produce a warning."""
        code = "print(y)"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 1
        assert "y" in undefined[0].message

    def test_function_inner_variable_not_visible_at_module_scope(self):
        """Variable defined inside a function must NOT count as module-level defined."""
        code = "def f():\n    x = 1\nprint(x)"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 1
        assert "x" in undefined[0].message

    def test_class_inner_variable_not_visible_at_module_scope(self):
        """Variable defined inside a class must NOT count as module-level defined."""
        code = "class C:\n    x = 1\nprint(x)"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 1
        assert "x" in undefined[0].message

    def test_module_level_for_loop_variable_visible(self):
        """For-loop variable at module level IS visible after the loop."""
        code = "for i in range(10):\n    pass\nprint(i)"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_module_level_if_body_variable_visible(self):
        """Variable assigned in module-level if-body IS at module scope."""
        code = "if True:\n    x = 1\nprint(x)"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0

    def test_no_false_positive_inside_function(self):
        """Names used inside functions should not trigger false positives."""
        code = "def f(x):\n    y = x + 1\n    return y"
        result = analyze_code(code)

        undefined = [d for d in result.diagnostics if d.code == DiagnosticCode.UNDEFINED_NAME]
        assert len(undefined) == 0


class TestCurriculumVersionConstant:
    """Test that the shared curriculum version constant exists and is consistent."""

    def test_constant_value(self):
        from backend.app.core.constants import CURRICULUM_VERSION
        assert CURRICULUM_VERSION == "v1"
        assert isinstance(CURRICULUM_VERSION, str)
