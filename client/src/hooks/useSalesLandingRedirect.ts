import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { getSalesDefaultLanding } from "@/lib/navigationRegistry";

export function useSalesLandingRedirect() {
  const { user, isAuthenticated } = useAuth();
  const { getAllFlags } = useFeatureFlags();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    if (user.role === "sales" && location === "/") {
      const featureFlags = getAllFlags();
      const salesLanding = getSalesDefaultLanding(featureFlags);
      setLocation(salesLanding);
    }
  }, [isAuthenticated, user, location, setLocation, getAllFlags]);
}
