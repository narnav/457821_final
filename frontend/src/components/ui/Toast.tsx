import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => {
            setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/40 bg-success-muted",
  error: "border-error/40 bg-error-muted",
  info: "border-accent/40 bg-accent-muted",
};

const variantDots: Record<ToastVariant, string> = {
  success: "bg-success",
  error: "bg-error",
  info: "bg-accent",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      className={`pointer-events-auto animate-slide-up rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3 max-w-sm ${variantStyles[toast.variant]}`}
      role="alert"
    >
      <div className={`h-2 w-2 rounded-full shrink-0 ${variantDots[toast.variant]}`} />
      <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-secondary transition-colors text-xs shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
