import { cn } from "@/lib/cn";

interface SectionTitleProps {
  children: string;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h2 className={cn("text-2xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}
