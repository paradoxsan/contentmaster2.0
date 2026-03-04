import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-meta-border bg-meta-surface px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-meta-hover">
          <span className="text-xs font-semibold text-meta-text">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm text-meta-text-secondary">
          {currentUser?.email}
        </span>
        <button
          onClick={logout}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-meta-text-secondary hover:bg-meta-hover transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
