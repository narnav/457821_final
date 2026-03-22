"""
Exercise-related models for Lumo.

Defines data structures for exercises and exercise selection results.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ExerciseType(str, Enum):
    """Category of exercise determining interaction style."""

    GUIDED_PRACTICE = "guided_practice"
    DEBUGGING = "debugging"
    INDEPENDENT_TASK = "independent_task"


class ExerciseDefinition(BaseModel):
    """Static definition of an exercise from the curriculum."""

    model_config = {"frozen": True}

    exercise_id: str
    name: str
    module_id: str
    exercise_type: ExerciseType
    skills: tuple[str, ...]
    order: int
    instructions: str = ""
    starter_code: str = ""
    answer_mode: str = "code"
    expected_output: str = ""


class ExerciseSelection(BaseModel):
    """
    Result of exercise selection.

    Contains the selected exercise and position metadata.
    """

    model_config = {"frozen": True}

    exercise: ExerciseDefinition
    index: int
    skipped_count: int
    is_last_in_list: bool
