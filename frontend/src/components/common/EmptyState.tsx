interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-text-primary">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-text-secondary max-w-md">{description}</p>
      )}
    </div>
  );
}
