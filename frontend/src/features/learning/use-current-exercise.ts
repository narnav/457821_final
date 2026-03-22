import { useQuery } from "@tanstack/react-query";
import { learningApi } from "@/api/learning.api";
import { HttpError } from "@/api/http";
import { authStorage } from "@/features/auth/auth-storage";
import { learningKeys } from "./learning.keys";

export function useCurrentExercise() {
  const userId = authStorage.getUserId() ?? "";

  return useQuery({
    queryKey: learningKeys.currentExercise(userId),
    queryFn: () => learningApi.getCurrentExercise(userId),
    enabled: !!userId,
    retry: (failureCount, error) => {
      // 404 means no state/exercise — don't retry, let the page handle it
      if (error instanceof HttpError && error.status === 404) return false;
      // 409 means curriculum exhausted — also don't retry
      if (error instanceof HttpError && error.status === 409) return false;
      return failureCount < 1;
    },
  });
}
