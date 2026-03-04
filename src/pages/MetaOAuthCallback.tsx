import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// This page receives the redirect from Meta, then forwards to the Cloud Function
// which handles the code exchange. Meta redirects here: /auth/meta/callback?code=...
export function MetaOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      navigate("/accounts?error=access_denied", { replace: true });
      return;
    }

    if (!code || !state) {
      navigate("/accounts?error=missing_params", { replace: true });
      return;
    }

    const fnUrl = import.meta.env.DEV
      ? `http://localhost:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1/metaOAuthCallback`
      : `/metaOAuthCallback`;

    // Redirect to the Cloud Function which handles token exchange and DB writes
    window.location.href = `${fnUrl}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-meta-bg">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-meta-text-secondary">Connecting your account...</p>
      </div>
    </div>
  );
}
