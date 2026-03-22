import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { onboardingApi } from "@/api/onboarding.api";
import type { OnboardingPayload } from "@/api/types";
import { authStorage } from "@/features/auth/auth-storage";
import { ROUTE_PATHS } from "@/routes/route-paths";
import type { OnboardingFormValues } from "./onboarding.schema";

export function useOnboarding() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: OnboardingFormValues) => {
      const userId = authStorage.getUserId();
      if (!userId) throw new Error("Not authenticated");

      const payload: OnboardingPayload = {
        preferred_languages: ["en"],
        prior_experience: data.prior_experience,
        learning_goals: data.learning_goals,
        pace_preference: data.pace_preference,
      };

      return onboardingApi.submit(userId, payload);
    },
    onSuccess: () => {
      navigate(ROUTE_PATHS.app);
    },
  });
}
