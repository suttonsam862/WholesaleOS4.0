import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useTestMode } from "@/contexts/TestModeContext";

// Frontend-safe User type that excludes passwordHash
type FrontendUser = Omit<User, 'passwordHash'>;

export function useAuth() {
  return useQuery<FrontendUser>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Unauthorized");
      }

      return res.json() as Promise<User>;
    },
    retry: false,
    throwOnError: false, // Don't throw on 401, handle gracefully
    refetchInterval: 5 * 60 * 1000, // Optional: Check auth every 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });
}