import { Link } from "react-router";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { ROUTE_PATHS } from "@/routes/route-paths";

const FEATURES = [
  {
    icon: "01",
    title: "Structured Path",
    desc: "A clear curriculum that builds understanding step by step — no guesswork.",
  },
  {
    icon: "02",
    title: "AI Mentor",
    desc: "Guidance and hints that teach you to think, not just copy answers.",
  },
  {
    icon: "03",
    title: "Practice First",
    desc: "Hands-on exercises designed for real comprehension and confidence.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <LandingNavbar />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center pt-44 pb-28 px-6">
        <div className="animate-fade-in">
          <p className="text-sm font-medium text-accent mb-5 tracking-wide uppercase">
            Learn programming the right way
          </p>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] max-w-3xl animate-slide-up">
          Learn to code with a{" "}
          <span className="text-accent">patient mentor</span>
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-xl leading-relaxed animate-slide-up" style={{ animationDelay: "80ms" }}>
          Lumo guides you through programming fundamentals with structured
          exercises and thoughtful feedback. No shortcuts, just understanding.
        </p>
        <div className="mt-10 flex gap-4 animate-slide-up" style={{ animationDelay: "160ms" }}>
          <Link
            to={ROUTE_PATHS.signup}
            className="px-7 py-3 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent-hover transition-all hover:shadow-[0_0_24px_rgba(79,131,255,0.3)]"
          >
            Start Learning
          </Link>
          <Link
            to={ROUTE_PATHS.login}
            className="px-7 py-3 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover transition-all"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-bg-surface p-6 hover:border-border-hover hover:bg-bg-elevated/50 transition-all group"
            >
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 text-accent text-xs font-bold mb-4 group-hover:bg-accent/20 transition-colors">
                {feature.icon}
              </span>
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-xs text-text-muted">
          Lumo &mdash; Learn to think like a programmer
        </p>
      </footer>
    </div>
  );
}
