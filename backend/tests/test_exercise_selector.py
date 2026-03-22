"""Tests for Exercise Selector - verifying exercise selection logic."""

import pytest

from backend.app.core.exercise_selector import select_next_exercise
from backend.app.models.curriculum import Pacing
from backend.app.models.exercise import ExerciseDefinition, ExerciseSelection, ExerciseType


class TestExerciseSelectionHappyPath:
    """Test standard exercise selection scenarios."""

    def test_first_exercise_selection(self, sample_exercises):
        """First exercise is selected when current_index is None."""
        result = select_next_exercise(sample_exercises, None, Pacing.NORMAL)

        assert result is not None
        assert isinstance(result, ExerciseSelection)
        assert result.index == 0
        assert result.exercise == sample_exercises[0]

    def test_sequential_selection(self, sample_exercises):
        """Exercises are selected sequentially with NORMAL pacing."""
        result = select_next_exercise(sample_exercises, 0, Pacing.NORMAL)

        assert result is not None
        assert result.index == 1
        assert result.skipped_count == 0

    def test_returns_valid_exercise_selection(self, sample_exercises):
        """Returns properly structured ExerciseSelection."""
        result = select_next_exercise(sample_exercises, 2, Pacing.NORMAL)

        assert result is not None
        assert isinstance(result.exercise, ExerciseDefinition)
        assert isinstance(result.index, int)
        assert isinstance(result.skipped_count, int)
        assert isinstance(result.is_last_in_list, bool)


class TestEndOfList:
    """Test behavior at end of exercise list."""

    def test_returns_none_when_list_exhausted(self, sample_exercises):
        """Returns None when at end of list."""
        last_index = len(sample_exercises) - 1
        result = select_next_exercise(sample_exercises, last_index, Pacing.NORMAL)

        assert result is None

    def test_returns_none_for_empty_list(self):
        """Returns None for empty exercise list."""
        result = select_next_exercise([], None, Pacing.NORMAL)

        assert result is None

    def test_is_last_in_list_flag(self, sample_exercises):
        """is_last_in_list is True only for final exercise."""
        # Get second to last exercise (index 5, pointing to index 6)
        result = select_next_exercise(sample_exercises, 5, Pacing.NORMAL)

        assert result is not None
        assert result.is_last_in_list is True

    def test_is_not_last_for_middle_exercises(self, sample_exercises):
        """is_last_in_list is False for non-final exercises."""
        result = select_next_exercise(sample_exercises, 0, Pacing.NORMAL)

        assert result is not None
        assert result.is_last_in_list is False


class TestFastPacing:
    """Test FAST pacing behavior."""

    def test_fast_pacing_skips_at_index_3(self, sample_exercises):
        """FAST pacing skips one exercise after index 2."""
        result = select_next_exercise(sample_exercises, 2, Pacing.FAST)

        assert result is not None
        assert result.index == 4  # Skips from 2 to 4 (skipping index 3)
        assert result.skipped_count == 1

    def test_fast_pacing_no_skip_at_index_0(self, sample_exercises):
        """FAST pacing doesn't skip at start of list."""
        result = select_next_exercise(sample_exercises, 0, Pacing.FAST)

        assert result is not None
        assert result.index == 1
        assert result.skipped_count == 0

    def test_fast_pacing_no_skip_at_index_1(self, sample_exercises):
        """FAST pacing doesn't skip early in list."""
        result = select_next_exercise(sample_exercises, 1, Pacing.FAST)

        assert result is not None
        assert result.index == 2
        assert result.skipped_count == 0

    def test_fast_pacing_no_skip_for_short_list(self):
        """FAST pacing doesn't skip in lists with 4 or fewer items."""
        short_exercises = [
            ExerciseDefinition(
                exercise_id=f"ex_{i}",
                name=f"Exercise {i}",
                module_id="module_1",
                exercise_type=ExerciseType.GUIDED_PRACTICE,
                skills=("basics",),
                order=i,
            )
            for i in range(1, 5)  # Only 4 exercises
        ]
        result = select_next_exercise(short_exercises, 2, Pacing.FAST)

        assert result is not None
        assert result.index == 3  # No skip
        assert result.skipped_count == 0

    def test_fast_pacing_after_skip_continues_normally(self, sample_exercises):
        """After FAST skip, progression continues normally."""
        result = select_next_exercise(sample_exercises, 4, Pacing.FAST)

        assert result is not None
        assert result.index == 5
        assert result.skipped_count == 0


class TestNormalPacing:
    """Test NORMAL pacing behavior."""

    def test_normal_pacing_never_skips(self, sample_exercises):
        """NORMAL pacing never skips exercises."""
        for i in range(len(sample_exercises) - 1):
            result = select_next_exercise(sample_exercises, i, Pacing.NORMAL)
            assert result is not None
            assert result.index == i + 1
            assert result.skipped_count == 0

    def test_normal_pacing_sequential_progression(self, sample_exercises):
        """NORMAL pacing progresses sequentially through entire list."""
        indices = []
        current = None

        while True:
            result = select_next_exercise(sample_exercises, current, Pacing.NORMAL)
            if result is None:
                break
            indices.append(result.index)
            current = result.index

        assert indices == list(range(len(sample_exercises)))


class TestSlowPacing:
    """Test SLOW pacing behavior."""

    def test_slow_pacing_never_skips(self, sample_exercises):
        """SLOW pacing never skips exercises."""
        for i in range(len(sample_exercises) - 1):
            result = select_next_exercise(sample_exercises, i, Pacing.SLOW)
            assert result is not None
            assert result.index == i + 1
            assert result.skipped_count == 0


class TestNoMutation:
    """Test that input data is not mutated."""

    def test_input_list_not_mutated(self, sample_exercises):
        """Exercise list is not mutated during selection."""
        original_ids = [e.exercise_id for e in sample_exercises]

        select_next_exercise(sample_exercises, 0, Pacing.NORMAL)
        select_next_exercise(sample_exercises, 2, Pacing.FAST)
        select_next_exercise(sample_exercises, 5, Pacing.SLOW)

        current_ids = [e.exercise_id for e in sample_exercises]
        assert original_ids == current_ids

    def test_input_list_length_unchanged(self, sample_exercises):
        """Exercise list length is unchanged after selection."""
        original_length = len(sample_exercises)

        for i in range(len(sample_exercises)):
            select_next_exercise(sample_exercises, i, Pacing.FAST)

        assert len(sample_exercises) == original_length


class TestDeterminism:
    """Test that output is deterministic."""

    def test_same_input_produces_same_output(self, sample_exercises):
        """Identical inputs produce identical results."""
        result1 = select_next_exercise(sample_exercises, 2, Pacing.FAST)
        result2 = select_next_exercise(sample_exercises, 2, Pacing.FAST)

        assert result1 == result2

    def test_repeated_execution_consistency(self, sample_exercises):
        """Multiple executions with same input are consistent."""
        results = [
            select_next_exercise(sample_exercises, 3, Pacing.NORMAL)
            for _ in range(10)
        ]

        assert all(r == results[0] for r in results)


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_single_exercise_list(self):
        """Single exercise list works correctly."""
        single = [
            ExerciseDefinition(
                exercise_id="ex_1",
                name="Only Exercise",
                module_id="module_1",
                exercise_type=ExerciseType.GUIDED_PRACTICE,
                skills=("basics",),
                order=1,
            )
        ]

        result = select_next_exercise(single, None, Pacing.NORMAL)
        assert result is not None
        assert result.index == 0
        assert result.is_last_in_list is True

        # Trying to get next returns None
        result2 = select_next_exercise(single, 0, Pacing.NORMAL)
        assert result2 is None

    def test_negative_index_handled(self, sample_exercises):
        """Negative index is treated as a position (may produce valid next)."""
        # Implementation doesn't explicitly validate, but logic should handle
        result = select_next_exercise(sample_exercises, -1, Pacing.NORMAL)
        # -1 + 1 = 0, so should return first exercise
        assert result is not None
        assert result.index == 0

    def test_index_beyond_list(self, sample_exercises):
        """Index beyond list length returns None."""
        result = select_next_exercise(sample_exercises, 100, Pacing.NORMAL)
        assert result is None

    def test_exercises_as_sequence(self, sample_exercises):
        """Works with any Sequence, not just list."""
        tuple_exercises = tuple(sample_exercises)
        result = select_next_exercise(tuple_exercises, None, Pacing.NORMAL)

        assert result is not None
        assert result.index == 0
