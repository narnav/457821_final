import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTE_PATHS } from "@/routes/route-paths";
import { useLogin } from "@/features/auth/use-login";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/auth.schema";

export function LoginForm() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate(data);
  };

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-8 shadow-xl shadow-black/20">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Log in to continue learning
      </p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Email
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-lg border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-error">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Password
          </label>
          <input
            type="password"
            {...register("password")}
            className="w-full rounded-lg border border-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.error && (
          <div className="rounded-lg border border-error/30 bg-error-muted px-4 py-2.5 animate-scale-in">
            <p className="text-sm text-error">{login.error.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-all hover:shadow-[0_0_20px_rgba(79,131,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {login.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Logging in...
            </span>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link to={ROUTE_PATHS.signup} className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
