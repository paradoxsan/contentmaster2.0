import { useAuth } from "@/hooks/useAuth";

export function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-meta-text">Dashboard</h2>
        <p className="mt-1 text-meta-text-secondary">
          Welcome back, {currentUser?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
          <p className="text-sm font-medium text-meta-text-secondary">
            Scheduled Posts
          </p>
          <p className="mt-2 text-3xl font-bold text-meta-text">0</p>
        </div>
        <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
          <p className="text-sm font-medium text-meta-text-secondary">
            Published This Week
          </p>
          <p className="mt-2 text-3xl font-bold text-meta-text">0</p>
        </div>
        <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
          <p className="text-sm font-medium text-meta-text-secondary">
            Connected Accounts
          </p>
          <p className="mt-2 text-3xl font-bold text-meta-text">0</p>
        </div>
      </div>

      <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-meta-text">
          Recent Activity
        </h3>
        <p className="mt-4 text-center text-sm text-meta-text-secondary">
          No recent activity. Create your first post to get started.
        </p>
      </div>
    </div>
  );
}
