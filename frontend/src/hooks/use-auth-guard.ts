import { authStorage } from "@/features/auth/auth-storage";

export function useAuthGuard() {
  return {
    isAuthenticated: authStorage.isAuthenticated(),
    userId: authStorage.getUserId(),
  };
}
