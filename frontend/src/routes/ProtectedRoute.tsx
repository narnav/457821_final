import { Navigate, Outlet } from "react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ROUTE_PATHS } from "./route-paths";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthGuard();

  if (!isAuthenticated) {
    console.info("[Lumo]", JSON.stringify({ stage: "route_guard", action: "redirect", from: "protected", target: ROUTE_PATHS.login }));
    return <Navigate to={ROUTE_PATHS.login} replace />;
  }

  return <Outlet />;
}
