import { useMutation, useQueryClient } from "@tanstack/react-query";
import { learningApi } from "@/api/learning.api";
import type { AttemptPayload } from "@/api/types";
import { authStorage } from "@/features/auth/auth-storage";
import { learningKeys } from "./learning.keys";

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  const userId = authStorage.getUserId() ?? "";

  return useMutation({
    mutationFn: (data: AttemptPayload) => {
      if (!userId) throw new Error("Not authenticated");
      return learningApi.submitAttempt(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: learningKeys.userState(userId),
      });
      queryClient.invalidateQueries({
        queryKey: learningKeys.currentExercise(userId),
      });
    },
  });
}
