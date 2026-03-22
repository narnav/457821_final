import { http } from "./http";
import type {
  AttemptPayload,
  AttemptResponse,
  CurrentExercise,
  UserState,
} from "./types";

export const learningApi = {
  getUserState: (userId: string) =>
    http.get<UserState>(`/users/${userId}/state`),

  getCurrentExercise: (userId: string) =>
    http.get<CurrentExercise>(`/users/${userId}/current-exercise`),

  submitAttempt: (userId: string, data: AttemptPayload) =>
    http.post<AttemptResponse>(`/users/${userId}/attempt`, data),
};
