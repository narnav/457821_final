"""
Curriculum-related models for Lumo.

Defines data structures for learning tracks, modules, and curriculum plans.
The CurriculumPlan is the output of the CurriculumAgent.
"""

from enum import Enum

from pydantic import BaseModel


class Pacing(str, Enum):
    """
    Learning pace affecting content delivery speed.

    SLOW: More repetition, more scaffolding.
    NORMAL: Balanced progression.
    FAST: Minimal repetition, quicker advancement.
    """

    SLOW = "slow"
    NORMAL = "normal"
    FAST = "fast"


class ModuleInfo(BaseModel):
    """Lightweight reference to a curriculum module."""

    model_config = {"frozen": True}

    module_id: str
    name: str
    order: int
    is_skippable: bool


class CurriculumPlan(BaseModel):
    """
    Personalized learning plan produced by the CurriculumAgent.

    Defines WHAT the user learns and at what PACE.
    """

    model_config = {"frozen": True}

    user_id: str
    track_id: str
    modules: tuple[ModuleInfo, ...]
    pacing: Pacing
    allow_exploration: bool
    skip_modules: tuple[str, ...]
