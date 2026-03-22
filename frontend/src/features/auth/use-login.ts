import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { authApi } from "@/api/auth.api";
import { HttpError } from "@/api/http";
import { learningApi } from "@/api/learning.api";
import type { LoginRequest } from "@/api/types";
import { authStorage } from "./auth-storage";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const auth = await authApi.login(data);
      // Store session before state check — HTTP client reads token from localStorage
      authStorage.setSession(auth.access_token, auth.user_id);
      console.info("[Lumo]", JSON.stringify({ stage: "auth", result: "login_ok" }));

      try {
        await learningApi.getUserState(auth.user_id);
        console.info("[Lumo]", JSON.stringify({ stage: "auth", result: "state_check_ok", is_onboarded: true }));
        return { isOnboarded: true };
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          console.info("[Lumo]", JSON.stringify({ stage: "auth", result: "state_check_404", is_onboarded: false }));
          return { isOnboarded: false };
        }
        // Non-404 failure: clear session so user stays on login page, surface error
        console.error("[Lumo]", JSON.stringify({
          stage: "auth", result: "state_check_fail",
          status: error instanceof HttpError ? error.status : undefined,
        }));
        authStorage.clear();
        throw error;
      }
    },
    onSuccess: (result) => {
      const target = result.isOnboarded ? ROUTE_PATHS.app : ROUTE_PATHS.onboarding;
      console.info("[Lumo]", JSON.stringify({ stage: "auth", action: "redirect", target }));
      navigate(target);
    },
  });
}
