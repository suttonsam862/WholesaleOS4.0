import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useTestMode } from "@/contexts/TestModeContext";

// Frontend-safe User type that excludes passwordHash
type FrontendUser = Omit<User, 'passwordHash'>;

export function useAuth() {
  const { isTestMode } = useTestMode();
  
  return useQuery<FrontendUser>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });

        if (!res.ok) {
          // In test mode, log more details
          if (isTestMode) {
            console.log('🔐 [useAuth] Authentication check failed (expected for unauthenticated users):', {
              error: await res.text(),
              isAuthenticated: false,
              timestamp: new Date().toISOString()
            });
          }
          throw new Error("Unauthorized");
        }

        return res.json() as Promise<User>;
      } catch (error) {
        // Log error only in test mode for debugging
        if (isTestMode && error instanceof Error) {
          console.log('🔐 [useAuth] Authentication check failed (expected for unauthenticated users):', {
            error: error.message,
            isAuthenticated: false,
            timestamp: new Date().toISOString()
          });
        }
        throw error;
      }
    },
    retry: false,
    throwOnError: false, // Don't throw on 401, handle gracefully
    refetchInterval: 5 * 60 * 1000, // Optional: Check auth every 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}