import { Link } from "react-router";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-bg-primary/80 backdrop-blur-md border-b border-border/50 animate-slide-down">
      <Link to={ROUTE_PATHS.home} className="flex items-center gap-2 group">
        <div className="h-7 w-7 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
          <span className="text-accent font-bold text-sm">L</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Lumo</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to={ROUTE_PATHS.login}
          className="text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors"
        >
          Log in
        </Link>
        <Link
          to={ROUTE_PATHS.signup}
          className="text-sm px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(79,131,255,0.25)]"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
