import { Navigate } from "react-router";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { HttpError } from "@/api/http";
import { useUserState } from "@/features/learning/use-user-state";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function OnboardingPage() {
  const { data, error, isLoading } = useUserState();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary">Checking your profile...</p>
        </div>
      </div>
    );
  }

  if (data) return <Navigate to={ROUTE_PATHS.app} replace />;

  // 404 is the expected "not onboarded" signal — show the wizard
  if (error instanceof HttpError && error.status === 404) {
    return <OnboardingWizard />;
  }

  // Unexpected error — do NOT show the wizard
  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <div className="text-center max-w-sm">
        <div className="h-12 w-12 rounded-full bg-error-muted flex items-center justify-center mx-auto mb-4">
          <span className="text-error text-xl">!</span>
        </div>
        <p className="text-sm text-error font-medium mb-2">
          Unable to check your onboarding status.
        </p>
        <p className="text-xs text-text-muted mb-5">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 text-sm rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
