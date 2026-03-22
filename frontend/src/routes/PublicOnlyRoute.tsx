import { Navigate, Outlet } from "react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ROUTE_PATHS } from "./route-paths";

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuthGuard();

  if (isAuthenticated) {
    // Route to /onboarding — it handles the 200→/app vs 404→wizard decision
    console.info("[Lumo]", JSON.stringify({ stage: "route_guard", action: "redirect", from: "public_only", target: ROUTE_PATHS.onboarding }));
    return <Navigate to={ROUTE_PATHS.onboarding} replace />;
  }

  return <Outlet />;
}
