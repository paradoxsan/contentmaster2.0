import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/router/routes";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-meta-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-meta-text">404</h1>
        <p className="mt-4 text-lg text-meta-text-secondary">
          Page not found
        </p>
        <Link to={ROUTES.DASHBOARD} className="mt-6 inline-block">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
