import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/router/routes";

export function Register() {
  const { signUp, currentUser, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (currentUser) return <Navigate to={ROUTES.DASHBOARD} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password);
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-meta-bg">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-meta-blue">
            <span className="text-xl font-bold text-white">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-meta-text">
            Create an Account
          </h1>
          <p className="mt-1 text-meta-text-secondary">
            Get started with Content Master
          </p>
        </div>
        <div className="rounded-lg border border-meta-border bg-meta-surface p-8 shadow-sm">
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
              <p className="mt-1 text-xs text-meta-text-secondary">Minimum 6 characters.</p>
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-meta-border bg-meta-hover px-4 py-3 text-[15px] text-meta-text placeholder:text-meta-text-secondary focus:border-meta-blue focus:bg-meta-surface focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-meta-text-secondary">
            Already have an account?{" "}
          </span>
          <Link
            to={ROUTES.LOGIN}
            className="text-sm font-semibold text-meta-blue hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
