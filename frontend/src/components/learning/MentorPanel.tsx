import type { AttemptResponse } from "@/api/types";

interface MentorPanelProps {
  feedback?: AttemptResponse | null;
}

export function MentorPanel({ feedback }: MentorPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface h-full flex flex-col overflow-y-auto">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">
          Mentor
        </h3>
      </div>

      {!feedback ? (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-accent text-lg">?</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Submit your code to get<br />mentor feedback
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-5 animate-fade-in">
          {/* Passed/Failed banner */}
          <div
            className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
              feedback.passed
                ? "bg-success-muted border border-success/30"
                : "bg-error-muted border border-error/30"
            }`}
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                feedback.passed
                  ? "bg-success/20 text-success"
                  : "bg-error/20 text-error"
              }`}
            >
              {feedback.passed ? "\u2713" : "\u2717"}
            </div>
            <p className={`text-sm font-medium ${feedback.passed ? "text-success" : "text-error"}`}>
              {feedback.passed ? "Exercise passed!" : "Not quite right"}
            </p>
          </div>

          {/* Diagnostics summary */}
          {(feedback.diagnostics_summary.error_count > 0 ||
            feedback.diagnostics_summary.warning_count > 0) && (
            <div className="rounded-lg bg-bg-elevated p-3.5">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Diagnostics
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={
                    feedback.diagnostics_summary.error_count > 0
                      ? "text-error"
                      : "text-success"
                  }
                >
                  {feedback.diagnostics_summary.error_count} error
                  {feedback.diagnostics_summary.error_count !== 1 && "s"}
                </span>
                <span
                  className={
                    feedback.diagnostics_summary.warning_count > 0
                      ? "text-warning"
                      : "text-text-muted"
                  }
                >
                  {feedback.diagnostics_summary.warning_count} warning
                  {feedback.diagnostics_summary.warning_count !== 1 && "s"}
                </span>
              </div>
              {feedback.diagnostics_summary.codes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {feedback.diagnostics_summary.codes.map((code) => (
                    <span
                      key={code}
                      className="text-xs px-2 py-0.5 rounded-md bg-bg-primary text-text-muted font-mono"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Encouragement */}
          <p className="text-sm text-text-primary leading-relaxed">
            {feedback.mentor_response.encouragement}
          </p>

          {/* Hint */}
          {feedback.mentor_response.hint && (
            <div className="rounded-lg bg-bg-elevated/60 p-3.5">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">
                Hint
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feedback.mentor_response.hint}
              </p>
            </div>
          )}

          {/* Next action */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">
              Next Step
            </p>
            <p className="text-sm text-accent leading-relaxed">
              {feedback.mentor_response.next_action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
