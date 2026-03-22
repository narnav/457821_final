interface ProgressCardProps {
  moduleIndex: number;
  exerciseIndex: number;
  pacing: string;
  totalExercises: number;
}

export function ProgressCard({
  moduleIndex,
  exerciseIndex,
  pacing,
  totalExercises,
}: ProgressCardProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-muted uppercase tracking-wide">
          Progress
        </p>
        <span className="text-xs px-2 py-0.5 rounded-md bg-accent/10 text-accent capitalize">
          {pacing}
        </span>
      </div>
      <p className="text-lg font-semibold">Module {moduleIndex + 1}</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${Math.min(((exerciseIndex + 1) / totalExercises) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-text-muted tabular-nums">
          {exerciseIndex + 1} / {totalExercises}
        </span>
      </div>
    </div>
  );
}
