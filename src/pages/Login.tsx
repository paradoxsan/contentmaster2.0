import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/router/routes";

export function Login() {
  const { signIn, signInWithFacebook, currentUser, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fbSubmitting, setFbSubmitting] = useState(false);

  if (loading) return null;
  if (currentUser) return <Navigate to={ROUTES.DASHBOARD} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFacebookSignIn() {
    setError("");
    setFbSubmitting(true);
    try {
      await signInWithFacebook();
    } catch {
      setError("Facebook sign-in failed. Please try again.");
    } finally {
      setFbSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-meta-bg">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-meta-blue">
            <span className="text-xl font-bold text-white">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-meta-text">Content Master</h1>
          <p className="mt-1 text-meta-text-secondary">
            Sign in to manage your content
          </p>
        </div>
        <div className="rounded-lg border border-meta-border bg-meta-surface p-8 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-meta-red">
                {error}
              </div>
            )}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-meta-border bg-meta-hover px-4 py-3 text-[15px] text-meta-text placeholder:text-meta-text-secondary focus:border-meta-blue focus:bg-meta-surface focus:outline-none"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-meta-border bg-meta-hover px-4 py-3 text-[15px] text-meta-text placeholder:text-meta-text-secondary focus:border-meta-blue focus:bg-meta-surface focus:outline-none"
              />
            </div>
            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="relative py-2 text-center text-xs text-meta-text-secondary">
            <span className="bg-meta-surface px-2">or</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={fbSubmitting}
            className="w-full"
            onClick={handleFacebookSignIn}
          >
            {fbSubmitting ? "Connecting to Facebook..." : "Continue with Facebook"}
          </Button>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-meta-text-secondary">
            Don't have an account?{" "}
          </span>
          <Link
            to={ROUTES.REGISTER}
            className="text-sm font-semibold text-meta-blue hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
