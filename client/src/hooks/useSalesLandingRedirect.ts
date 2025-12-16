import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { getSalesDefaultLanding } from "@/lib/navigationRegistry";

export function useSalesLandingRedirect() {
  const { data: user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [location, setLocation] = useLocation();
  const redirectedUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Only redirect if we're at home and user just logged in
    if (!user || location !== "/" || redirectedUserRef.current === user.id) return;
    
    // Only redirect to role home if the feature is enabled
    if (!isEnabled("enableRoleHome")) return;

    redirectedUserRef.current = user.id;

    // Map roles to their home pages
    const roleHomeMap: Record<string, string> = {
      admin: "/admin/home",
      sales: "/sales/home",
      designer: "/designer/home",
      ops: "/ops/home",
      manufacturer: "/manufacturer/home",
    };

    const homeRoute = roleHomeMap[user.role];
    if (homeRoute) {
      setLocation(homeRoute);
    } else if (user.role === "sales") {
      // Fallback for sales role with custom landing
      const salesLanding = getSalesDefaultLanding({ enableRoleHome: isEnabled("enableRoleHome") });
      setLocation(salesLanding);
    }
  }, [user?.id, user?.role, location, isEnabled, setLocation]);

  // Reset redirect flag when user logs out
  useEffect(() => {
    if (!user) {
      redirectedUserRef.current = null;
    }
  }, [user]);
}
