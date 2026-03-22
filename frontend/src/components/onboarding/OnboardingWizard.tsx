import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useOnboarding } from "@/features/onboarding/use-onboarding";
import {
  onboardingSchema,
  type OnboardingFormValues,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  PACE_OPTIONS,
} from "@/features/onboarding/onboarding.schema";

export function OnboardingWizard() {
  const onboarding = useOnboarding();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      prior_experience: "",
      learning_goals: [],
      pace_preference: "",
    },
  });

  const selectedExperience = watch("prior_experience");
  const selectedPace = watch("pace_preference");

  const onSubmit = (data: OnboardingFormValues) => {
    onboarding.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-1 flex-1 rounded-full bg-accent" />
          <div className="h-1 flex-1 rounded-full bg-accent/40" />
          <div className="h-1 flex-1 rounded-full bg-accent/15" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Let&apos;s personalize your path
        </h1>
        <p className="text-text-secondary mb-8">
          Answer a few questions so Lumo can tailor your learning experience.
        </p>

        <form
          className="rounded-xl border border-border bg-bg-surface p-8 space-y-8 shadow-xl shadow-black/20"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Experience */}
          <fieldset>
            <legend className="text-sm font-medium text-text-primary mb-3">
              What&apos;s your coding experience?
            </legend>
            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 cursor-pointer transition-all ${
                    selectedExperience === opt.value
                      ? "border-accent bg-accent/8 shadow-sm shadow-accent/10"
                      : "border-border hover:border-border-hover hover:bg-bg-hover/50"
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register("prior_experience")}
                    className="accent-accent"
                  />
                  <span className="text-sm text-text-primary">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.prior_experience && (
              <p className="mt-1.5 text-xs text-error">
                {errors.prior_experience.message}
              </p>
            )}
          </fieldset>

          {/* Goals */}
          <fieldset>
            <legend className="text-sm font-medium text-text-primary mb-3">
              What do you want to achieve?
            </legend>
            <div className="space-y-2">
              {GOAL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-lg border border-border hover:border-border-hover hover:bg-bg-hover/50 px-4 py-3.5 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    {...register("learning_goals")}
                    className="accent-accent"
                  />
                  <span className="text-sm text-text-primary">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.learning_goals && (
              <p className="mt-1.5 text-xs text-error">
                {errors.learning_goals.message}
              </p>
            )}
          </fieldset>

          {/* Pace */}
          <fieldset>
            <legend className="text-sm font-medium text-text-primary mb-3">
              Pick your pace
            </legend>
            <div className="grid grid-cols-3 gap-3">
              {PACE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-5 cursor-pointer text-center transition-all ${
                    selectedPace === opt.value
                      ? "border-accent bg-accent/8 shadow-sm shadow-accent/10"
                      : "border-border hover:border-border-hover hover:bg-bg-hover/50"
                  }`}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register("pace_preference")}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-text-primary">
                    {opt.label}
                  </span>
                  <span className="text-xs text-text-muted leading-snug">
                    {opt.description}
                  </span>
                </label>
              ))}
            </div>
            {errors.pace_preference && (
              <p className="mt-1.5 text-xs text-error">
                {errors.pace_preference.message}
              </p>
            )}
          </fieldset>

          {onboarding.error && (
            <div className="rounded-lg border border-error/30 bg-error-muted px-4 py-2.5 animate-scale-in">
              <p className="text-sm text-error">{onboarding.error.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={onboarding.isPending}
            className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(79,131,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {onboarding.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Setting up your path...
              </span>
            ) : (
              "Start learning"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
