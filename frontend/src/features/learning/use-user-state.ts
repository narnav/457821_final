import { useQuery } from "@tanstack/react-query";
import { learningApi } from "@/api/learning.api";
import { HttpError } from "@/api/http";
import { authStorage } from "@/features/auth/auth-storage";
import { learningKeys } from "./learning.keys";

export function useUserState() {
  const userId = authStorage.getUserId() ?? "";

  return useQuery({
    queryKey: learningKeys.userState(userId),
    queryFn: () => learningApi.getUserState(userId),
    enabled: !!userId,
    retry: (failureCount, error) => {
      // 404 is an expected signal (not onboarded) — don't retry
      if (error instanceof HttpError && error.status === 404) return false;
      return failureCount < 1;
    },
  });
}
