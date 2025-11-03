import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/features/users/useMe";
import { ROLES } from "@/constants/roles";
import { PATHS } from "./paths";

export default function ProtectedRoute({ roles }) {
  const { user, isLoading } = useMe();
  if (isLoading) return null;
  if (!user) return <Navigate to={PATHS.login} replace />;

  if (!roles || roles.length === 0) return <Outlet />;

  const hasRole = user.roles?.some((r) => roles.includes(r));
  return hasRole ? <Outlet /> : <Navigate to={PATHS.dashboard} replace />;
}
