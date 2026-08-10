import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.js";

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) return <div className="shell"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.role || !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
