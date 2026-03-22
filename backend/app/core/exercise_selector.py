"""
Exercise Selector for Lumo.

Pure function that selects the next exercise from a list based on
current position and pacing. No class needed - the logic is trivial.

Design:
- Stateless: all inputs passed as arguments
- Deterministic: same inputs → same output
- Generic: works with any exercise list
"""

from typing import Optional, Sequence

from backend.app.models.curriculum import Pacing
from backend.app.models.exercise import ExerciseDefinition, ExerciseSelection
from backend.app.observability.logging_config import get_logger

_log = get_logger("core.exercise_selector")


def select_next_exercise(
    exercises: Sequence[ExerciseDefinition],
    current_index: Optional[int],
    pacing: Pacing,
    trace_id: Optional[str] = None,
) -> Optional[ExerciseSelection]:
    """
    Select the next exercise from a list.

    Args:
        exercises: Ordered list of exercises.
        current_index: Last completed index, or None to start fresh.
        pacing: Affects whether exercises can be skipped.
        trace_id: Optional correlation ID.

    Returns:
        ExerciseSelection with the next exercise, or None if list exhausted.

    Rules:
        - SLOW/NORMAL: Sequential (index + 1)
        - FAST: May skip one exercise after index 2 (never first/last)
    """
    _log.debug(
        "select_next_exercise START current=%s pacing=%s pool_size=%d",
        current_index, pacing.value, len(exercises),
        extra={"stage": "exercise_selector", "trace_id": trace_id},
    )
    if not exercises:
        _log.debug("select_next_exercise END empty pool", extra={"trace_id": trace_id})
        return None

    # Determine next index
    if current_index is None:
        next_idx = 0
        skipped = 0
    else:
        next_idx = current_index + 1
        skipped = 0

        # FAST pacing: skip one at index 3 if list is long enough
        if pacing == Pacing.FAST and current_index == 2 and len(exercises) > 4:
            next_idx = current_index + 2
            skipped = 1

    # List exhausted
    if next_idx >= len(exercises):
        _log.info(
            "select_next_exercise END exhausted",
            extra={"stage": "exercise_selector", "trace_id": trace_id},
        )
        return None

    result = ExerciseSelection(
        exercise=exercises[next_idx],
        index=next_idx,
        skipped_count=skipped,
        is_last_in_list=(next_idx == len(exercises) - 1),
    )
    _log.info(
        "select_next_exercise END selected_index=%d skipped=%d is_last=%s",
        result.index, result.skipped_count, result.is_last_in_list,
        extra={"stage": "exercise_selector", "trace_id": trace_id},
    )
    return result
