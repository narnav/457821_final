import { Link } from "react-router";
import { ROUTE_PATHS } from "@/routes/route-paths";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4 animate-fade-in">
      <p className="text-7xl font-bold text-text-muted/50">404</p>
      <p className="mt-4 text-lg text-text-secondary">Page not found</p>
      <Link
        to={ROUTE_PATHS.home}
        className="mt-8 px-5 py-2.5 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(79,131,255,0.2)]"
      >
        Back to home
      </Link>
    </div>
  );
}
