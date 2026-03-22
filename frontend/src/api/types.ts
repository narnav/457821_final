// ── Auth ──
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
}

// ── Onboarding ──
export interface OnboardingPayload {
  preferred_languages: string[];
  prior_experience: string | null;
  learning_goals: string[];
  pace_preference: string | null;
}

export interface OnboardingResponse {
  user_id: string;
  skill_level: string;
  learning_style: string;
  pacing: string;
  message: string;
}

// ── Learning ──
export interface UserState {
  module_index: number;
  exercise_index: number;
  pacing: string;
}

export interface CurrentExercise {
  exercise_prompt: string;
  module_index: number;
  exercise_index: number;
  exercise_id: string;
  exercise_type: string;
  instructions: string;
  starter_code: string;
  answer_mode: "text" | "code";
  module_exercise_count: number;
}

export interface AttemptPayload {
  code: string;
}

export interface DiagnosticSummary {
  error_count: number;
  warning_count: number;
  codes: string[];
}

export interface MentorResponse {
  hint: string;
  encouragement: string;
  next_action: string;
}

export interface AttemptResponse {
  exercise_prompt: string;
  passed: boolean;
  diagnostics_summary: DiagnosticSummary;
  mentor_response: MentorResponse;
  state: UserState;
}

// ── Common ──
export interface ApiError {
  detail: string;
}
