import { http } from "./http";
import type { AuthResponse, LoginRequest, SignupRequest } from "./types";

export const authApi = {
  login: (data: LoginRequest) =>
    http.post<AuthResponse>("/auth/login", data),

  signup: (data: SignupRequest) =>
    http.post<AuthResponse>("/auth/signup", data),
};
