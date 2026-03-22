interface ExercisePromptCardProps {
  title: string;
  exerciseType: string;
  instructions: string;
}

const TYPE_LABELS: Record<string, string> = {
  guided_practice: "Guided Practice",
  debugging: "Debugging",
  independent_task: "Independent Task",
};

const TYPE_COLORS: Record<string, string> = {
  guided_practice: "bg-accent/10 text-accent",
  debugging: "bg-warning-muted text-warning",
  independent_task: "bg-success-muted text-success",
};

export function ExercisePromptCard({
  title,
  exerciseType,
  instructions,
}: ExercisePromptCardProps) {
  const label = TYPE_LABELS[exerciseType] ?? exerciseType;
  const colorClass = TYPE_COLORS[exerciseType] ?? "bg-accent-muted text-accent";

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium uppercase tracking-wide px-2.5 py-1 rounded-md ${colorClass}`}>
          {label}
        </span>
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-3 leading-snug">
        {title}
      </h3>

      {instructions && (
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {instructions}
        </p>
      )}
    </div>
  );
}
