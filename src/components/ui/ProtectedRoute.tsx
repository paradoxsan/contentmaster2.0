import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

export function ProtectedRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!currentUser) return <Navigate to="/login" replace />;

  return <Outlet />;
}
