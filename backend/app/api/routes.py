"""API routes for Lumo."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from backend.app.api.auth import get_current_user, require_owner

from backend.app.agents.curriculum import CurriculumAgent
from backend.app.agents.mentor import MentorAgent
from backend.app.agents.user_profiler import UserProfilerAgent
from backend.app.api.schemas import (
    AttemptRequest, AttemptResponse,
    CurrentExerciseResponse, DiagnosticSummary, MentorResponseSchema,
    OnboardingRequest, OnboardingResponse, StateSnapshot,
)
from backend.app.core.constants import CURRICULUM_VERSION
from backend.app.core.curriculum_loader import load_curriculum
from backend.app.core.diagnostics import DiagnosticSeverity, DiagnosticsResult, analyze_code
from backend.app.core.exercise_selector import select_next_exercise
from backend.app.db import (
    create_attempt, create_exercise_instance, create_or_update_user_profile,
    create_user_state,
    get_session, get_user_by_id, get_user_profile_by_user_id, get_user_state,
    update_user_state,
)
from backend.app.models.curriculum import Pacing
from backend.app.models.user import LearningStyle, OnboardingInput, SkillLevel, UserProfile
from backend.app.observability import get_logger, new_trace_id, safe_user_ref

_log = get_logger("api.routes")
router = APIRouter()
_profiler = UserProfilerAgent()
_curriculum_agent = CurriculumAgent()
_mentor = MentorAgent()


def _get_db():
    yield from get_session()


@router.post("/users/{user_id}/onboarding", response_model=OnboardingResponse)
def onboarding_endpoint(
    user_id: UUID,
    req: OnboardingRequest,
    request: Request,
    session: Session = Depends(_get_db),
    current_user: "User" = Depends(get_current_user),
):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    user_ref = safe_user_ref(str(user_id))
    _log.info("POST /onboarding", extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})

    require_owner(current_user, user_id)

    user = get_user_by_id(session, user_id)
    if not user:
        _log.warning("POST /onboarding FAIL reason=user_not_found",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User not found")

    onboarding = OnboardingInput(
        age=user.age, preferred_languages=tuple(req.preferred_languages),
        prior_experience=req.prior_experience,
        learning_goals=tuple(req.learning_goals), pace_preference=req.pace_preference,
    )
    profile = _profiler.profile(onboarding, user_id=str(user_id), trace_id=trace_id)
    create_or_update_user_profile(session, profile, trace_id=trace_id)

    # Use CurriculumAgent to derive initial state from profile + curriculum data
    curriculum = load_curriculum(trace_id=trace_id)
    plan = _curriculum_agent.plan(profile, curriculum.modules, curriculum.track_id, trace_id=trace_id)
    pacing = plan.pacing.value

    # Derive starting module_index from plan's first included module
    module_index = 0
    if plan.modules:
        first_module_id = plan.modules[0].module_id
        for i, m in enumerate(curriculum.modules):
            if m.module_id == first_module_id:
                module_index = i
                break

    if get_user_state(session, user_id):
        update_user_state(session, user_id, module_index=module_index, exercise_index=0, pacing=pacing, trace_id=trace_id)
    else:
        create_user_state(
            session, user_id=user_id, curriculum_version=CURRICULUM_VERSION,
            module_index=module_index, exercise_index=0, pacing=pacing, trace_id=trace_id,
        )

    _log.info("POST /onboarding OK skill=%s pacing=%s module_start=%d",
              profile.inferred_skill_level.value, pacing, module_index,
              extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
    return OnboardingResponse(
        user_id=user_id, skill_level=profile.inferred_skill_level.value,
        learning_style=profile.learning_style.value, pacing=pacing,
        message="Onboarding complete. Ready to start learning.",
    )


# -- Read-only state endpoints -----------------------------------------------


@router.get("/users/{user_id}/state", response_model=StateSnapshot)
def get_user_state_endpoint(
    user_id: UUID,
    request: Request,
    session: Session = Depends(_get_db),
    current_user: "User" = Depends(get_current_user),
):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    user_ref = safe_user_ref(str(user_id))
    _log.info("GET /state", extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})

    require_owner(current_user, user_id)

    if not get_user_by_id(session, user_id):
        _log.warning("GET /state FAIL reason=user_not_found",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User not found")

    state = get_user_state(session, user_id)
    if not state:
        _log.info("GET /state MISS reason=state_not_found",
                   extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User state not found")

    _log.info("GET /state OK module=%d exercise=%d pacing=%s",
              state.module_index, state.exercise_index, state.pacing,
              extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
    return StateSnapshot(
        module_index=state.module_index,
        exercise_index=state.exercise_index,
        pacing=state.pacing,
    )


@router.get("/users/{user_id}/current-exercise", response_model=CurrentExerciseResponse)
def get_current_exercise_endpoint(
    user_id: UUID,
    request: Request,
    session: Session = Depends(_get_db),
    current_user: "User" = Depends(get_current_user),
):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    user_ref = safe_user_ref(str(user_id))
    _log.info("GET /current-exercise", extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})

    require_owner(current_user, user_id)

    if not get_user_by_id(session, user_id):
        _log.warning("GET /current-exercise FAIL reason=user_not_found",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User not found")

    state = get_user_state(session, user_id)
    if not state:
        _log.info("GET /current-exercise MISS reason=state_not_found",
                   extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User state not found")

    curriculum, exercises, exercise = _resolve_exercise(state, trace_id)

    _log.info("GET /current-exercise OK exercise=%s type=%s mode=%s",
              exercise.exercise_id, exercise.exercise_type.value, exercise.answer_mode,
              extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
    return CurrentExerciseResponse(
        exercise_prompt=exercise.name,
        module_index=state.module_index,
        exercise_index=state.exercise_index,
        exercise_id=exercise.exercise_id,
        exercise_type=exercise.exercise_type.value,
        instructions=exercise.instructions,
        starter_code=exercise.starter_code,
        answer_mode=exercise.answer_mode,
        module_exercise_count=len(exercises),
    )


# -- Attempt helpers --------------------------------------------------------


def _profile_from_record(record) -> UserProfile:
    """Reconstruct a domain UserProfile from a persisted UserProfileRecord."""
    import json as _json
    langs = tuple(_json.loads(record.preferred_languages_json))
    raw = OnboardingInput.model_validate_json(record.raw_input_json)
    return UserProfile(
        user_id=str(record.user_id),
        inferred_skill_level=SkillLevel(record.skill_level),
        confidence_score=record.confidence_score,
        learning_style=LearningStyle(record.learning_style),
        initial_track=record.initial_track,
        preferred_languages=langs,
        raw_input=raw,
    )


def _check_text_answer(user_answer: str, expected: str) -> bool:
    """Compare a text-mode answer to the expected output.

    Strips leading/trailing whitespace and trailing whitespace on each line,
    then does an exact comparison (case-sensitive, since Python output is).
    """
    def _normalize(s: str) -> str:
        return "\n".join(line.rstrip() for line in s.strip().splitlines())

    return _normalize(user_answer) == _normalize(expected)


def _resolve_exercise(state, trace_id):
    """Load curriculum and return (curriculum, exercises, current_exercise)."""
    user_ref = safe_user_ref(str(state.user_id))
    curriculum = load_curriculum(trace_id=trace_id)
    if state.module_index >= len(curriculum.modules):
        _log.warning(
            "Curriculum completed module_index=%d total_modules=%d",
            state.module_index, len(curriculum.modules),
            extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id},
        )
        raise HTTPException(status_code=409, detail="Curriculum completed")
    module = curriculum.modules[state.module_index]
    exercises = curriculum.get_exercises(module.module_id)
    if not exercises or state.exercise_index >= len(exercises):
        _log.warning(
            "Module exercises exhausted module_index=%d exercise_index=%d available=%d",
            state.module_index, state.exercise_index, len(exercises) if exercises else 0,
            extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id},
        )
        raise HTTPException(status_code=409, detail="Module exercises exhausted")
    return curriculum, exercises, exercises[state.exercise_index]


@router.post("/users/{user_id}/attempt", response_model=AttemptResponse)
def attempt_endpoint(
    user_id: UUID,
    req: AttemptRequest,
    request: Request,
    session: Session = Depends(_get_db),
    current_user: "User" = Depends(get_current_user),
):
    trace_id = getattr(request.state, "trace_id", None) or new_trace_id()
    user_ref = safe_user_ref(str(user_id))
    _log.info("POST /attempt code_len=%d", len(req.code),
              extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})

    require_owner(current_user, user_id)

    if not get_user_by_id(session, user_id):
        _log.warning("POST /attempt FAIL reason=user_not_found",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=404, detail="User not found")

    profile_record = get_user_profile_by_user_id(session, user_id)
    if not profile_record:
        _log.warning("POST /attempt FAIL reason=onboarding_required",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
        raise HTTPException(status_code=409, detail="Onboarding required before submitting attempts")

    state = get_user_state(session, user_id)
    if not state:
        state = create_user_state(session, user_id=user_id, curriculum_version=CURRICULUM_VERSION, trace_id=trace_id)

    curriculum, exercises, exercise = _resolve_exercise(state, trace_id)

    # Snapshot exercise instance
    instance = create_exercise_instance(
        session, user_id=user_id, curriculum_version=state.curriculum_version,
        module_index=state.module_index, exercise_index=state.exercise_index,
        prompt_text=exercise.name, trace_id=trace_id,
    )

    # --- Correctness check depends on answer_mode ---
    if exercise.answer_mode == "text":
        # Text-mode: compare answer to expected output, skip code diagnostics
        passed = _check_text_answer(req.code, exercise.expected_output)
        diag_result = DiagnosticsResult(diagnostics=(), has_errors=False)
        if passed:
            mentor_resp_schema = MentorResponseSchema(
                hint="",
                encouragement="Correct! Your prediction matches the expected output.",
                next_action="Moving on to the next exercise.",
            )
        else:
            mentor_resp_schema = MentorResponseSchema(
                hint="Try tracing through the code line by line, writing down what each statement produces.",
                encouragement="Not quite — keep trying! Predicting output takes practice.",
                next_action="Read through the code again carefully and resubmit your prediction.",
            )
    else:
        # Code-mode: run static diagnostics, pass if no errors
        diag_result = analyze_code(req.code, trace_id=trace_id)
        passed = not diag_result.has_errors
        mentor_resp = _mentor.generate_response(
            _profile_from_record(profile_record), exercise, diag_result, trace_id=trace_id,
        )
        mentor_resp_schema = MentorResponseSchema(
            hint=mentor_resp.hint, encouragement=mentor_resp.encouragement,
            next_action=mentor_resp.next_action,
        )

    # Persist attempt
    diag_json = json.dumps([
        {"code": d.code.value, "severity": d.severity.value, "message": d.message, "line": d.line}
        for d in diag_result.diagnostics
    ])
    create_attempt(
        session, user_id=user_id, exercise_instance_id=instance.id,
        code=req.code, diagnostics_json=diag_json,
        mentor_response_json=json.dumps(mentor_resp_schema.model_dump()),
        trace_id=trace_id,
    )

    # Advance state only when the exercise is actually solved
    if passed:
        pacing_enum = Pacing(state.pacing) if state.pacing in {p.value for p in Pacing} else Pacing.NORMAL
        next_sel = select_next_exercise(exercises, state.exercise_index, pacing_enum, trace_id=trace_id)
        if next_sel:
            update_user_state(session, user_id, exercise_index=next_sel.index, trace_id=trace_id)
        elif state.module_index + 1 < len(curriculum.modules):
            update_user_state(session, user_id, module_index=state.module_index + 1, exercise_index=0, trace_id=trace_id)
        else:
            # Terminal sentinel: module_index past end → future attempts get 409
            _log.info("Curriculum completed — setting terminal sentinel",
                      extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
            update_user_state(session, user_id, module_index=len(curriculum.modules), exercise_index=0, trace_id=trace_id)

    # Response
    updated = get_user_state(session, user_id)
    err_n = sum(1 for d in diag_result.diagnostics if d.severity == DiagnosticSeverity.ERROR)
    warn_n = sum(1 for d in diag_result.diagnostics if d.severity == DiagnosticSeverity.WARNING)
    _log.info("POST /attempt OK passed=%s errors=%d warnings=%d exercise=%s",
              passed, err_n, warn_n, exercise.exercise_id,
              extra={"stage": "api", "user_ref": user_ref, "trace_id": trace_id})
    return AttemptResponse(
        exercise_prompt=exercise.name,
        passed=passed,
        diagnostics_summary=DiagnosticSummary(
            error_count=err_n, warning_count=warn_n,
            codes=[d.code.value for d in diag_result.diagnostics[:5]],
        ),
        mentor_response=mentor_resp_schema,
        state=StateSnapshot(
            module_index=updated.module_index, exercise_index=updated.exercise_index,
            pacing=updated.pacing,
        ),
    )
