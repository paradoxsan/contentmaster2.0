import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { ROUTES } from "./routes";
import { Dashboard } from "@/pages/Dashboard";
import { CreatePost } from "@/pages/CreatePost";
import { Planner } from "@/pages/Planner";
import { Accounts } from "@/pages/Accounts";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { NotFound } from "@/pages/NotFound";
import { MetaOAuthCallback } from "@/pages/MetaOAuthCallback";

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.REGISTER,
    element: <Register />,
  },
  {
    path: "/auth/meta/callback",
    element: <MetaOAuthCallback />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.CREATE_POST, element: <CreatePost /> },
          { path: ROUTES.PLANNER, element: <Planner /> },
          { path: ROUTES.ACCOUNTS, element: <Accounts /> },
          { path: ROUTES.SETTINGS, element: <Settings /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
