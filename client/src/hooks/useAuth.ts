import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useTestMode } from "@/contexts/TestModeContext";

// Frontend-safe User type that excludes passwordHash
type FrontendUser = Omit<User, 'passwordHash'>;

// Consistent auth interface for all components
interface AuthState {
  user: FrontendUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAuth(): AuthState {
  const { isTestMode } = useTestMode();
  
  const query = useQuery<FrontendUser>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (!res.ok) {
        if (isTestMode) {
          console.log('🔐 [useAuth] Not authenticated (expected for logged-out users)');
        }
        throw new Error("Unauthorized");
      }

      return res.json() as Promise<FrontendUser>;
    },
    retry: false,
    throwOnError: false,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isAuthenticated: !!query.data && !query.isError,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}