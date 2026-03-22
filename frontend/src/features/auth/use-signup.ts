import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { authApi } from "@/api/auth.api";
import type { SignupRequest } from "@/api/types";
import { authStorage } from "./auth-storage";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: (response) => {
      authStorage.setSession(response.access_token, response.user_id);
      navigate(ROUTE_PATHS.onboarding);
    },
  });
}
