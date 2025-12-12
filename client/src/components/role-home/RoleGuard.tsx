import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface RoleGuardProps {
  allowedRole?: string;
  allowedRoles?: string[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({ allowedRole, allowedRoles, children, fallbackPath = "/" }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);
  const hasAccess = roles.length === 0 || roles.includes(user?.role || "");

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      setLocation(fallbackPath);
    }
  }, [isLoading, hasAccess, fallbackPath, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
