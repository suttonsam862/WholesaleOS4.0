import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useTestMode } from "@/contexts/TestModeContext";

// Frontend-safe User type that excludes passwordHash
type FrontendUser = Omit<User, 'passwordHash'>;

export function useAuth() {
  const { data: actualUser, isLoading, error, isError } = useQuery<FrontendUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false, // Don't throw on 401, handle gracefully
  });
  
  // Development mode logging for authentication errors
  if (process.env.NODE_ENV === 'development' && isError && error) {
    console.log('🔐 [useAuth] Authentication check failed (expected for unauthenticated users):', {
      error: error.message,
      isAuthenticated: false,
      timestamp: new Date().toISOString()
    });
  }
  
  const { isTestMode, testUser } = useTestMode();

  // If in test mode, return test user data instead of actual user
  // But preserve isAuthenticated based on actual user auth status
  const effectiveUser = isTestMode && testUser ? {
    ...testUser,
    isActive: true,
  } as FrontendUser : actualUser;

  return {
    user: effectiveUser,
    actualUser, // Expose actual user for admin panel
    isLoading,
    isAuthenticated: !!actualUser,
    isTestMode,
    error, // Expose error for debugging
    isError, // Expose error flag
  };
}
