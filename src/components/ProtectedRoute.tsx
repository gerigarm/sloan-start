import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const email = localStorage.getItem("user_email");
  const skipAuth = localStorage.getItem("skip_auth") === "true";

  if (!email && !skipAuth) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to onboarding if not completed (unless already there)
  if (email && location.pathname !== "/onboarding") {
    const onboardingDone = localStorage.getItem(`onboarding_done_${email}`);
    if (onboardingDone !== "true") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
