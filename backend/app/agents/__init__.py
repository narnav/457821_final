"""Lumo agents."""

from backend.app.agents.curriculum import CurriculumAgent
from backend.app.agents.mentor import MentorAgent
from backend.app.agents.user_profiler import UserProfilerAgent

__all__ = [
    "CurriculumAgent",
    "MentorAgent",
    "UserProfilerAgent",
]
