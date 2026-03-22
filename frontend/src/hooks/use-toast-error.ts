import { useCallback } from "react";
import { formatError } from "@/lib/utils";

/**
 * Placeholder for toast-based error display.
 * Will be wired to a toast/notification system later.
 */
export function useToastError() {
  const showError = useCallback((error: unknown) => {
    console.error("[Lumo]", formatError(error));
  }, []);

  return { showError };
}
