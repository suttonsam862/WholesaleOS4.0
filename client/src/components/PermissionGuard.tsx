import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/lib/permissions";

interface PermissionGuardProps {
  resource: Resource;
  children: React.ReactNode;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

export function PermissionGuard({ 
  resource, 
  children, 
  fallbackPath,
  showAccessDenied = true 
}: PermissionGuardProps) {
  const { isPageVisible, isLoading } = usePermissions();
  const { data: user, isPending: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const hasAccess = isPageVisible(resource);

  useEffect(() => {
    if (!isLoading && !authLoading && !hasAccess && fallbackPath) {
      setLocation(fallbackPath);
    }
  }, [isLoading, authLoading, hasAccess, fallbackPath, setLocation]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallbackPath) {
      return null;
    }

    if (showAccessDenied) {
      return (
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this page.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
