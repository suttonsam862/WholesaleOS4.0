import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isFeatureEnabled, getFeatureFlags } from "@/lib/featureFlags";
import { getDefaultLandingForRole } from "@/lib/navigationRegistry";
import type { UserRole } from "@/lib/permissions";

export function useSalesLandingRedirect() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect authenticated users at "/" who haven't been redirected yet
    if (!isAuthenticated || !user || location !== "/" || hasRedirected.current) {
      return;
    }

    // Only redirect if role home feature is enabled
    if (!isFeatureEnabled("enableRoleHome")) {
      return;
    }

    // Mark as redirected to prevent loops
    hasRedirected.current = true;

    // Get the role-specific default landing (for sales, this is the map)
    const featureFlags = getFeatureFlags() as unknown as Record<string, boolean>;
    const defaultRoute = getDefaultLandingForRole(user.role as UserRole, featureFlags);
    if (defaultRoute && defaultRoute !== "/") {
      setLocation(defaultRoute);
    }
  }, [isAuthenticated, user, location, setLocation]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);
}
