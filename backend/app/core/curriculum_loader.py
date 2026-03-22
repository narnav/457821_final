"""
Curriculum Loader for Lumo.

Loads curriculum data from YAML files and provides structured data
for agents to consume. This is the single source of truth for
curriculum content.

Design:
- Loads once at startup (or on-demand)
- Returns immutable data structures
- Subject-agnostic: works with any curriculum format
"""

from pathlib import Path
from typing import Optional

import yaml

from backend.app.models.curriculum import ModuleInfo
from backend.app.models.exercise import ExerciseDefinition, ExerciseType
from backend.app.observability.logging_config import get_logger

_log = get_logger("core.curriculum_loader")


# Default curriculum directory relative to project root
CURRICULUM_DIR = Path(__file__).parent.parent.parent.parent / "curriculum" / "v1"


class CurriculumData:
    """
    Loaded curriculum data for a single track.

    Provides access to modules and exercises without coupling
    agents to file I/O or YAML parsing.
    """

    def __init__(
        self,
        track_id: str,
        track_name: str,
        modules: tuple[ModuleInfo, ...],
        exercises_by_module: dict[str, tuple[ExerciseDefinition, ...]],
    ):
        self.track_id = track_id
        self.track_name = track_name
        self.modules = modules
        self._exercises_by_module = exercises_by_module

    def get_exercises(self, module_id: str) -> tuple[ExerciseDefinition, ...]:
        """Get exercises for a specific module."""
        return self._exercises_by_module.get(module_id, ())


def load_curriculum(track_file: Optional[Path] = None, trace_id: Optional[str] = None) -> CurriculumData:
    """
    Load curriculum data from a YAML file.

    Args:
        track_file: Path to the curriculum YAML. Defaults to python_basic.yaml.
        trace_id: Optional correlation ID.

    Returns:
        CurriculumData with modules and exercises.
    """
    if track_file is None:
        track_file = CURRICULUM_DIR / "python_basic.yaml"

    _log.info(
        "load_curriculum START file=%s", track_file.name,
        extra={"stage": "curriculum_loader", "trace_id": trace_id},
    )
    try:
        with open(track_file) as f:
            data = yaml.safe_load(f)
    except Exception:
        _log.exception("Failed to load curriculum file=%s", track_file)
        raise

    track_info = data.get("track", {})
    track_id = track_info.get("id", "unknown")
    track_name = track_info.get("name", "Unknown Track")

    modules: list[ModuleInfo] = []
    exercises_by_module: dict[str, tuple[ExerciseDefinition, ...]] = {}

    for module_data in data.get("modules", []):
        module_id = module_data["id"]
        order = module_data.get("order", 0)

        # Module info
        modules.append(
            ModuleInfo(
                module_id=module_id,
                name=module_data.get("name", module_id),
                order=order,
                is_skippable=order > 2,  # First two modules never skippable
            )
        )

        # Extract exercises from all pools
        module_exercises: list[ExerciseDefinition] = []
        exercise_order = 0

        exercise_pool = module_data.get("exercise_pool", {})
        for pool_type, exercises in exercise_pool.items():
            ex_type = _map_exercise_type(pool_type)
            for ex in exercises:
                # Derive answer_mode: explicit YAML value > default from type
                default_mode = "text" if ex_type == ExerciseType.GUIDED_PRACTICE else "code"
                answer_mode = ex.get("answer_mode", default_mode)

                module_exercises.append(
                    ExerciseDefinition(
                        exercise_id=ex["id"],
                        name=ex.get("name", ex["id"]),
                        module_id=module_id,
                        exercise_type=ex_type,
                        skills=tuple(ex.get("skills", [])),
                        order=exercise_order,
                        instructions=ex.get("instructions", "").strip(),
                        starter_code=ex.get("starter_code", "").strip(),
                        answer_mode=answer_mode,
                        expected_output=ex.get("expected_output", "").strip(),
                    )
                )
                exercise_order += 1

        exercises_by_module[module_id] = tuple(module_exercises)

    total_exercises = sum(len(v) for v in exercises_by_module.values())
    _log.info(
        "load_curriculum END track=%s modules=%d exercises=%d",
        track_id, len(modules), total_exercises,
        extra={"stage": "curriculum_loader", "trace_id": trace_id},
    )

    return CurriculumData(
        track_id=track_id,
        track_name=track_name,
        modules=tuple(modules),
        exercises_by_module=exercises_by_module,
    )


def _map_exercise_type(pool_name: str) -> ExerciseType:
    """Map YAML pool names to ExerciseType enum."""
    mapping = {
        "guided_practice": ExerciseType.GUIDED_PRACTICE,
        "debugging": ExerciseType.DEBUGGING,
        "independent_task": ExerciseType.INDEPENDENT_TASK,
    }
    return mapping.get(pool_name, ExerciseType.GUIDED_PRACTICE)
