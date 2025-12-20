import { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { PermissionGuard } from "@/components/PermissionGuard";
import { RoleGuard } from "@/components/role-home/RoleGuard";
import { useSalesLandingRedirect } from "@/hooks/useSalesLandingRedirect";
import { PageTransition } from "@/components/ui/page-transition";
import { SkeletonCard } from "@/components/ui/skeleton";
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-6">
      <div className="w-full max-w-md space-y-4">
        <SkeletonCard />
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-md bg-muted skeleton-shimmer" />
          <div className="h-10 w-24 rounded-md bg-muted skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

function RouteRenderer({ route, user, routeKey }: { route: RouteConfig; user: any; routeKey: string }) {
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

  return (
    <PageTransition key={routeKey}>
      {content}
    </PageTransition>
  );
}

export function AppShell() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [location] = useLocation();

  useSalesLandingRedirect();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return (
      <AnimatePresence mode="wait">
        <Switch>
          {publicRoutes.map((route) => (
            <Route key={route.path} path={route.path}>
              <PageTransition key={route.path}>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <route.component />
                </Suspense>
              </PageTransition>
            </Route>
          ))}
          <Route>
            <PageTransition key="not-found">
              <Suspense fallback={<RouteLoadingFallback />}>
                <notFoundRoute.component />
              </Suspense>
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    );
  }

  const enabledRoleHomeRoutes = roleHomeRoutes.filter(route => {
    if (route.featureFlag) {
      return isEnabled(route.featureFlag as keyof FeatureFlags);
    }
    return true;
  });

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        {publicRoutes.filter(r => r.path !== "/").map((route) => (
          <Route key={route.path} path={route.path}>
            <PageTransition key={route.path}>
              <Suspense fallback={<RouteLoadingFallback />}>
                <route.component />
              </Suspense>
            </PageTransition>
          </Route>
        ))}

        {enabledRoleHomeRoutes.map((route) => (
          <Route key={route.path} path={route.path}>
            <RouteRenderer route={route} user={user} routeKey={route.path} />
          </Route>
        ))}

        {authenticatedRoutes.map((route) => (
          <Route key={route.path} path={route.path}>
            <RouteRenderer route={route} user={user} routeKey={route.path} />
          </Route>
        ))}

        <Route>
          <PageTransition key="not-found">
            <Suspense fallback={<RouteLoadingFallback />}>
              <notFoundRoute.component />
            </Suspense>
          </PageTransition>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}
