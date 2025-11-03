import { Navigate } from "react-router-dom";
import { useMe } from "@/features/users/useMe";
import { ROLES } from "@/constants/roles";
import { PATHS } from "./paths";

export default function RoleRedirect() {
  const { user, isLoading } = useMe();
  if (isLoading) return null;

  if (!user) return <Navigate to={PATHS.login} replace />;

  const roles = new Set(user.roles || []);
  if (roles.has(ROLES.ADMIN)) return <Navigate to={PATHS.admin} replace />;
  if (roles.has(ROLES.ORGANIZER)) return <Navigate to={PATHS.organizer} replace />;
  if (roles.has(ROLES.VENDOR)) return <Navigate to={PATHS.vendor} replace />;
  return <Navigate to={PATHS.attendee} replace />;
}
