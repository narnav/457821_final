import { z } from "zod";

export const EXPERIENCE_OPTIONS = [
  { value: "none", label: "No experience" },
  { value: "some", label: "Dabbled a little" },
  { value: "experienced", label: "Built a few things" },
] as const;

export const GOAL_OPTIONS = [
  { value: "build websites", label: "Build websites" },
  { value: "automate tasks", label: "Automate tasks" },
  { value: "get a tech job", label: "Get a tech job" },
  { value: "explore and experiment", label: "Explore and experiment" },
  { value: "school coursework", label: "School / coursework" },
] as const;

export const PACE_OPTIONS = [
  { value: "slow", label: "Relaxed", description: "A few lessons per week" },
  { value: "normal", label: "Steady", description: "A lesson most days" },
  { value: "fast", label: "Intensive", description: "Multiple lessons daily" },
] as const;

export const onboardingSchema = z.object({
  prior_experience: z.string().min(1, "Please select your experience level"),
  learning_goals: z.array(z.string()).min(1, "Select at least one goal"),
  pace_preference: z.string().min(1, "Please select a pace"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
