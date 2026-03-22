import { useState, useCallback, useEffect, useRef } from "react";
import { Navigate } from "react-router";
import { ProgressCard } from "@/components/learning/ProgressCard";
import { ExercisePromptCard } from "@/components/learning/ExercisePromptCard";
import { MentorPanel } from "@/components/learning/MentorPanel";
import { CodeEditor } from "@/components/learning/CodeEditor";
import { ReadOnlyCode } from "@/components/learning/ReadOnlyCode";
import { SubmitBar } from "@/components/learning/SubmitBar";
import { HttpError } from "@/api/http";
import { useUserState } from "@/features/learning/use-user-state";
import { useCurrentExercise } from "@/features/learning/use-current-exercise";
import { useSubmitAttempt } from "@/features/learning/use-submit-attempt";
import { ROUTE_PATHS } from "@/routes/route-paths";
import type { AttemptResponse } from "@/api/types";

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-53px)] animate-pulse-soft">
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        <div className="col-span-3 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-bg-surface p-5 h-24" />
          <div className="rounded-xl border border-border bg-bg-surface p-6 flex-1">
            <div className="h-3 w-20 rounded bg-bg-elevated mb-4" />
            <div className="h-4 w-3/4 rounded bg-bg-elevated mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-bg-elevated" />
              <div className="h-3 w-5/6 rounded bg-bg-elevated" />
              <div className="h-3 w-2/3 rounded bg-bg-elevated" />
            </div>
          </div>
        </div>
        <div className="col-span-6">
          <div className="rounded-xl border border-border bg-bg-surface h-full">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated">
              <div className="h-3 w-3 rounded-full bg-bg-hover" />
              <div className="h-3 w-3 rounded-full bg-bg-hover" />
              <div className="h-3 w-3 rounded-full bg-bg-hover" />
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="rounded-xl border border-border bg-bg-surface h-full p-5">
            <div className="h-3 w-16 rounded bg-bg-elevated mb-6" />
            <div className="flex flex-col items-center justify-center h-32">
              <div className="h-10 w-10 rounded-full bg-bg-elevated mb-3" />
              <div className="h-3 w-24 rounded bg-bg-elevated" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-surface">
        <div className="h-3 w-32 rounded bg-bg-elevated" />
        <div className="h-8 w-20 rounded-lg bg-bg-elevated" />
      </div>
    </div>
  );
}

export function LearningPage() {
  const stateQuery = useUserState();
  const exerciseQuery = useCurrentExercise();
  const submitAttempt = useSubmitAttempt();

  const [code, setCode] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [feedback, setFeedback] = useState<AttemptResponse | null>(null);

  const answerMode = exerciseQuery.data?.answer_mode ?? "code";

  // Track current exercise identity to reset editor + feedback on advancement
  const exerciseId = exerciseQuery.data?.exercise_id;
  const prevExerciseIdRef = useRef(exerciseId);

  useEffect(() => {
    if (
      prevExerciseIdRef.current !== undefined &&
      exerciseId !== undefined &&
      prevExerciseIdRef.current !== exerciseId
    ) {
      // Exercise changed — load new starter code and clear stale feedback
      setCode(exerciseQuery.data?.starter_code ?? "");
      setTextAnswer("");
      setFeedback(null);
    } else if (prevExerciseIdRef.current === undefined && exerciseId !== undefined) {
      // Initial load — populate editor with starter code if user hasn't typed yet
      if (!code) {
        setCode(exerciseQuery.data?.starter_code ?? "");
      }
    }
    prevExerciseIdRef.current = exerciseId;
  }, [exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(() => {
    const submission = answerMode === "text" ? textAnswer : code;
    if (submitAttempt.isPending || !submission.trim()) return;

    const preState = stateQuery.data;

    submitAttempt.mutate(
      { code: submission },
      {
        onSuccess: (data) => {
          setFeedback(data);

          // Only clear inputs if the exercise actually advanced
          const advanced =
            preState &&
            (data.state.module_index !== preState.module_index ||
              data.state.exercise_index !== preState.exercise_index);

          if (advanced) {
            setCode("");
            setTextAnswer("");
          }
        },
      },
    );
  }, [answerMode, code, textAnswer, submitAttempt, stateQuery.data]);

  const isLoading = stateQuery.isLoading || exerciseQuery.isLoading;
  const error = stateQuery.error || exerciseQuery.error;

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  // User has no onboarding state — redirect instead of showing broken workspace
  if (stateQuery.error instanceof HttpError && stateQuery.error.status === 404) {
    return <Navigate to={ROUTE_PATHS.onboarding} replace />;
  }

  // Curriculum completed — show dedicated success screen
  if (exerciseQuery.error instanceof HttpError && exerciseQuery.error.status === 409) {
    const moduleCount = stateQuery.data?.module_index ?? 0;
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-5">
            <span className="text-success text-2xl">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Curriculum Complete!</h1>
          <p className="text-sm text-text-secondary mb-4">
            You've worked through all {moduleCount} module{moduleCount !== 1 ? "s" : ""} in the Python Basics track.
            That's a real achievement — keep building and experimenting on your own!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-surface border border-border text-xs text-text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-success" />
            All exercises completed
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className="text-center max-w-sm">
          <div className="h-12 w-12 rounded-full bg-error-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-error text-xl">!</span>
          </div>
          <p className="text-sm text-error font-medium mb-2">
            Something went wrong loading your workspace.
          </p>
          <p className="text-xs text-text-muted mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-lg bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const state = stateQuery.data;
  const exercise = exerciseQuery.data;

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Main workspace */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left panel: exercise + progress */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          {state && exercise && (
            <ProgressCard
              moduleIndex={state.module_index}
              exerciseIndex={state.exercise_index}
              pacing={state.pacing}
              totalExercises={exercise.module_exercise_count}
            />
          )}
          {exercise && (
            <ExercisePromptCard
              title={exercise.exercise_prompt}
              exerciseType={exercise.exercise_type}
              instructions={exercise.instructions}
            />
          )}
        </div>

        {/* Center: editor / answer area */}
        <div className="col-span-6 flex flex-col">
          {answerMode === "text" ? (
            <>
              {/* Read-only code display for predict-output exercises */}
              <ReadOnlyCode code={exercise?.starter_code ?? ""} />

              {/* Text answer input */}
              <div className="mt-3 rounded-xl border border-border bg-bg-surface overflow-hidden flex-1 flex flex-col">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated">
                  <span className="text-xs font-medium text-text-secondary">Your Answer</span>
                </div>
                <textarea
                  className="flex-1 w-full p-4 bg-transparent text-sm text-text-primary font-mono resize-none focus:outline-none placeholder:text-text-muted"
                  placeholder="Type the expected output here..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <CodeEditor
              value={code}
              onChange={setCode}
              onSubmit={handleSubmit}
            />
          )}
          {/* Mutation error banner */}
          {submitAttempt.error && (
            <div className="mt-2 rounded-lg border border-error/30 bg-error-muted px-4 py-2.5 animate-scale-in">
              <p className="text-sm text-error">
                Submission failed: {submitAttempt.error.message}
              </p>
            </div>
          )}
        </div>

        {/* Right panel: mentor */}
        <div className="col-span-3">
          <MentorPanel feedback={feedback} />
        </div>
      </div>

      {/* Bottom bar */}
      <SubmitBar onSubmit={handleSubmit} isPending={submitAttempt.isPending} />
    </div>
  );
}
