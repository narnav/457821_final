interface SubmitBarProps {
  onSubmit: () => void;
  isPending: boolean;
}

export function SubmitBar({ onSubmit, isPending }: SubmitBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-surface/80 backdrop-blur-sm">
      <p className="text-xs text-text-muted">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded-md bg-bg-elevated border border-border text-text-secondary text-xs font-mono">
          Ctrl+Enter
        </kbd>{" "}
        to submit
      </p>
      <button
        onClick={onSubmit}
        disabled={isPending}
        className="px-6 py-2 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(79,131,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
