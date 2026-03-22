import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";
import { ROUTE_PATHS } from "@/routes/route-paths";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { LearningPage } from "@/pages/LearningPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.home,
    element: <LandingPage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTE_PATHS.login, element: <LoginPage /> },
          { path: ROUTE_PATHS.signup, element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: ROUTE_PATHS.onboarding, element: <OnboardingPage /> },
      {
        element: <AppShell />,
        children: [{ path: ROUTE_PATHS.app, element: <LearningPage /> }],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
