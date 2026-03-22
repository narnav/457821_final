interface ReadOnlyCodeProps {
  code: string;
}

export function ReadOnlyCode({ code }: ReadOnlyCodeProps) {
  const lines = code.split("\n");

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-elevated">
        <div className="h-3 w-3 rounded-full bg-error/60" />
        <div className="h-3 w-3 rounded-full bg-warning/60" />
        <div className="h-3 w-3 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-text-muted">code to read</span>
      </div>
      <pre className="p-4 text-sm font-mono text-text-primary overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 shrink-0 text-right pr-3 text-text-muted select-none">
              {i + 1}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
