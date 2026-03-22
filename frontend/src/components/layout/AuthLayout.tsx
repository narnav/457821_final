import { Outlet, Link } from "react-router";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4">
      <Link
        to={ROUTE_PATHS.home}
        className="flex items-center gap-2.5 mb-10 group"
      >
        <div className="h-9 w-9 rounded-xl bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
          <span className="text-accent font-bold text-lg">L</span>
        </div>
        <span className="text-2xl font-semibold tracking-tight">Lumo</span>
      </Link>
      <div className="w-full max-w-md animate-slide-up">
        <Outlet />
      </div>
    </div>
  );
}
