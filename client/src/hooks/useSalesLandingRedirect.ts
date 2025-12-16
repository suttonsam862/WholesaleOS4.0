import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath, isFeatureEnabled } from "@/lib/featureFlags";

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

    // Get the role-specific home page
    const homeRoute = getRoleHomePath(user.role);
    if (homeRoute && homeRoute !== "/") {
      setLocation(homeRoute);
    }
  }, [isAuthenticated, user, location, setLocation]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);
}
