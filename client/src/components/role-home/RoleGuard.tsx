import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface RoleGuardProps {
  allowedRole: string;
  children: React.ReactNode;
  fallbackPath?: string;
}

export function RoleGuard({ allowedRole, children, fallbackPath = "/" }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user?.role !== allowedRole) {
      setLocation(fallbackPath);
    }
  }, [isLoading, user?.role, allowedRole, fallbackPath, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user?.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
