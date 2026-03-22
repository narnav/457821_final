import { Outlet, Link, useNavigate } from "react-router";
import { ROUTE_PATHS } from "@/routes/route-paths";
import { authStorage } from "@/features/auth/auth-storage";

export function AppShell() {
  const navigate = useNavigate();

  function handleLogout() {
    authStorage.clear();
    navigate(ROUTE_PATHS.home);
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-bg-surface/80 backdrop-blur-sm">
        <Link to={ROUTE_PATHS.app} className="flex items-center gap-2 group">
          <div className="h-7 w-7 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
            <span className="text-accent font-bold text-sm">L</span>
          </div>
          <span className="text-base font-semibold tracking-tight">Lumo</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors"
        >
          Log out
        </button>
      </header>
      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
