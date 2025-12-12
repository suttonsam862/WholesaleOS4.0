import { Suspense } from "react";
import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { PermissionGuard } from "@/components/PermissionGuard";
import { RoleGuard } from "@/components/role-home/RoleGuard";
import { 
  publicRoutes, 
  roleHomeRoutes, 
  authenticatedRoutes, 
  notFoundRoute,
  RouteConfig 
} from "@/lib/routesConfig";
import type { FeatureFlags } from "@/lib/featureFlags";

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function RouteRenderer({ route, user }: { route: RouteConfig; user: any }) {
  const Component = route.component;
  
  let content = (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Component />
    </Suspense>
  );

  if (route.resource) {
    content = (
      <PermissionGuard resource={route.resource} showAccessDenied={true}>
        {content}
      </PermissionGuard>
    );
  }

  if (route.roles && route.roles.length > 0) {
    content = (
      <RoleGuard allowedRoles={route.roles}>
        {content}
      </RoleGuard>
    );
  }

  if (route.requiresLayout) {
    content = <AppLayout title={route.title}>{content}</AppLayout>;
  }

  return content;
}

export function AppShell() {
  const { isAuthenticated, isLoading, isError, user } = useAuth();
  const { isEnabled } = useFeatureFlags();

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [AppShell] Auth state:', {
      isAuthenticated,
      isLoading,
      isError,
      timestamp: new Date().toISOString()
    });
  }

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || isError) {
    return (
      <Switch>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <route.component />
            </Suspense>
          </Route>
        ))}
        <Route>
          <Suspense fallback={<RouteLoadingFallback />}>
            <notFoundRoute.component />
          </Suspense>
        </Route>
      </Switch>
    );
  }

  const enabledRoleHomeRoutes = roleHomeRoutes.filter(route => {
    if (route.featureFlag) {
      return isEnabled(route.featureFlag as keyof FeatureFlags);
    }
    return true;
  });

  return (
    <Switch>
      {enabledRoleHomeRoutes.map((route) => (
        <Route key={route.path} path={route.path}>
          <RouteRenderer route={route} user={user} />
        </Route>
      ))}

      {authenticatedRoutes.map((route) => (
        <Route key={route.path} path={route.path}>
          <RouteRenderer route={route} user={user} />
        </Route>
      ))}

      <Route>
        <Suspense fallback={<RouteLoadingFallback />}>
          <notFoundRoute.component />
        </Suspense>
      </Route>
    </Switch>
  );
}
