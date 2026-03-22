import { http } from "./http";
import type { OnboardingPayload, OnboardingResponse } from "./types";

export const onboardingApi = {
  submit: (userId: string, data: OnboardingPayload) =>
    http.post<OnboardingResponse>(`/users/${userId}/onboarding`, data),
};
