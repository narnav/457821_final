import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto max-w-5xl px-6 py-10", className)}>
      {children}
    </div>
  );
}
